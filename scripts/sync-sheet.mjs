#!/usr/bin/env node
/**
 * Pulls the master jewellery sheet from Google Drive and normalises it into
 * data/products.json (what the site renders) and data/data-health.json
 * (problems found in the source sheet, so they can be fixed at the source).
 *
 * The sheet is shared publicly, so no credentials are required — this runs
 * unattended in CI.
 *
 *   node scripts/sync-sheet.mjs                # fetch live from Drive
 *   node scripts/sync-sheet.mjs --file a.xlsx  # parse a local copy instead
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readWorkbook } from './lib/xlsx.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Which sheet to pull, as a Drive file id. Configuration, not code: it is
 * supplied by the environment so the source can be repointed — or retired —
 * without a commit, and so the repository does not carry a live link to a
 * publicly-readable business document.
 *
 * Set it in Vercel (Settings → Environment Variables) and as the GitHub Actions
 * repository variable of the same name, or inline for a one-off run:
 *
 *   SHEET_ID=<drive-file-id> npm run sync
 *
 * Unset, the sync does nothing and the last committed catalogue stands.
 */
export const SHEET_ID = (process.env.SHEET_ID ?? '').trim()

/**
 * Columns are located by their header text, not by position.
 *
 * They used to be mapped positionally, because the headers were mislabelled
 * and shifted. The team has since corrected the sheet and inserted IMAGE 2 and
 * VIDEO 1, which pushed every later column one place right — and a positional
 * map cannot notice that. It silently read prices out of the metal-weight
 * column and reported 738 nonsense errors.
 *
 * Matching on the header survives inserts, reordering and renames. The one
 * header still not to be trusted is `description`, which holds the metal
 * colour; `required` fields make a genuine structural change fail loudly and
 * by name instead of producing a plausible-looking but wrong catalogue.
 */
const FIELDS = [
  { key: 'title', match: /^title$/i, required: true },
  { key: 'metalColour', match: /^description$/i, required: true }, // still mislabelled
  { key: 'sku', match: /^sku$/i, required: true },
  { key: 'metal', match: /^metal$/i }, // anchored: not "Metal weight"/"Metal length"
  { key: 'image1', match: /^(image\s*1|gallery)$/i, required: true }, // `gallery` was the old name
  { key: 'image2', match: /^image\s*2$/i },
  { key: 'video', match: /^video\s*1$/i },
  { key: 'carat', match: /^total\s+diamonds?\s+weight$/i },
  { key: 'minCarat', match: /^minimum\s+carat\s+weight$/i },
  { key: 'shape', match: /^diamonds?\s+shape$/i },
  { key: 'diamondCount', match: /^total\s+number\s+of\s+diamonds$/i },
  { key: 'colour', match: /^diamonds?\s+colou?r$/i },
  { key: 'clarity', match: /^diamonds?\s+clarity$/i },
  { key: 'metalWeight', match: /^metal\s+weight$/i },
  { key: 'designType', match: /^design\s+type$/i },
  { key: 'size', match: /^metal\s+length$/i },
  { key: 'price', match: /^price$/i, required: true },
  { key: 'origin', match: /^origin$/i },
]

/** Header row -> { field: columnIndex }, or null if the sheet is unusable. */
function locateColumns(headerRow, tab) {
  const headers = (headerRow ?? []).map((h) => String(h ?? '').trim())
  const index = {}
  const missing = []

  for (const field of FIELDS) {
    const at = headers.findIndex((h) => field.match.test(h))
    if (at === -1) {
      if (field.required) missing.push(field.key)
      continue
    }
    index[field.key] = at
  }

  if (missing.length) {
    flag(
      'errors',
      'MISSING_COLUMN',
      `Tab "${tab}" has no column for ${missing.join(', ')} — its rows were skipped.`,
      `Headers found: ${headers.filter(Boolean).join(' | ')}`,
    )
    return null
  }
  return index
}

/**
 * The six categories, matched to whatever the tabs happen to be called.
 *
 * Tabs get renamed — "Hoops Earrings" became "Earrings" and silently took a
 * whole category off the site, because the mapping keyed on the exact string.
 * So each category now carries a pattern instead, and any tab that matches
 * nothing is reported rather than ignored.
 *
 * Order matters: `Studs` has to be tested before the looser earrings pattern,
 * or studs would be swallowed by it.
 */
const CATEGORIES = [
  { name: 'Bracelets', slug: 'bracelets', match: /bracelet/i },
  { name: 'Stud Earrings', slug: 'stud-earrings', match: /stud/i },
  { name: 'Hoop Earrings', slug: 'hoop-earrings', match: /hoop|earring/i },
  { name: 'Rings', slug: 'rings', match: /^\s*rings?\s*$/i },
  { name: 'Necklaces', slug: 'necklaces', match: /necklace/i },
  { name: 'Pendants', slug: 'pendants', match: /pendant/i },
]

const health = { errors: [], warnings: [], notes: [] }
const flag = (level, code, message, detail) =>
  health[level].push({ code, message, ...(detail ? { detail } : {}) })

// --- normalisation helpers -------------------------------------------------

const clean = (v) => (v === null || v === undefined ? '' : String(v).trim())

/** "14K WHITE", "14KT White", "14K ROSE" -> "White" | "Yellow" | "Rose" */
function metalColour(raw) {
  const v = clean(raw).toUpperCase()
  if (v.includes('WHITE')) return 'White'
  if (v.includes('YELLOW')) return 'Yellow'
  if (v.includes('ROSE')) return 'Rose'
  return ''
}

/** "16.5 NCH" -> "16.5 INCH"; "NA" -> "" (that category has no size) */
function size(raw) {
  const v = clean(raw).toUpperCase().replace(/\bNCH\b/, 'INCH').replace(/\s+/g, ' ')
  return v === 'NA' ? '' : v
}

/**
 * Extracts every Drive file id from a gallery cell.
 *
 * The cell is free text and comes in several shapes: the usual
 * `/file/d/<id>/view` link, the older `open?id=<id>` form, and occasionally
 * two links pasted end to end (sometimes the same link twice). Order is kept
 * and repeats are dropped, so the first id is always the lead photo.
 */
function driveIds(cell) {
  const ids = [...clean(cell).matchAll(/(?:\/d\/|[?&]id=)([A-Za-z0-9_-]{10,})/g)].map((m) => m[1])
  return [...new Set(ids)]
}

/** Public, resizable render of a Drive image — works in a plain <img>. */
const imageUrl = (id, width) => `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`

/** Trailing-space and casing noise: "Pendant " and "Pendant" are one thing. */
const tidy = (raw) => clean(raw).replace(/\s+/g, ' ')

/** The sheet shouts its metals — "14K GOLD" reads better as "14K Gold". */
const metalName = (raw) =>
  tidy(raw).replace(/\b([A-Z]{4,})\b/g, (word) => word[0] + word.slice(1).toLowerCase())

/** Money and weights carry float noise (633.0600000000001). */
const round = (v, dp) => (typeof v === 'number' && isFinite(v) ? Number(v.toFixed(dp)) : null)

function slugify(s) {
  return clean(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// --- load ------------------------------------------------------------------

async function loadWorkbook() {
  const fileArg = process.argv.indexOf('--file')
  if (fileArg !== -1 && process.argv[fileArg + 1]) {
    const path = resolve(process.argv[fileArg + 1])
    console.log(`Reading local workbook ${path}`)
    return readWorkbook(await readFile(path))
  }

  if (!SHEET_ID) {
    throw new Error(
      'No sheet is configured. Set SHEET_ID to the Drive file id of the ' +
        'master sheet — in Vercel, as a GitHub Actions repository variable, or ' +
        'inline as `SHEET_ID=… npm run sync`. Until then there is nothing to ' +
        'pull, and the committed catalogue is what the site serves.',
    )
  }

  const url = `https://drive.google.com/uc?export=download&id=${SHEET_ID}`
  console.log(`Downloading sheet ${SHEET_ID} from Google Drive…`)
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) {
    throw new Error(
      `Drive returned ${res.status} ${res.statusText}. The sheet must stay shared ` +
        `as "Anyone with the link can view" for the sync to work.`,
    )
  }
  const buf = Buffer.from(await res.arrayBuffer())
  // A revoked share serves an HTML sign-in page with a 200.
  if (buf.subarray(0, 2).toString() !== 'PK') {
    throw new Error(
      'Drive served an HTML page instead of the spreadsheet — link sharing was ' +
        'probably turned off. Re-share the sheet as "Anyone with the link can view".',
    )
  }
  console.log(`Downloaded ${(buf.length / 1024).toFixed(0)} KB`)
  return readWorkbook(buf)
}

// --- transform -------------------------------------------------------------

function readRows(workbook) {
  const rows = []
  const seen = new Set()

  // Pair every tab in the workbook with the category it belongs to, so a
  // rename is harmless and an unrecognised tab is loud.
  const pairs = []
  const claimed = new Set()
  for (const tab of Object.keys(workbook)) {
    const category = CATEGORIES.find((c) => c.match.test(tab) && !claimed.has(c.slug))
    if (!category) {
      flag('errors', 'UNKNOWN_TAB', `Tab "${tab}" matches no category, so its rows are not on the site.`)
      continue
    }
    claimed.add(category.slug)
    pairs.push([tab, category])
  }
  for (const category of CATEGORIES) {
    if (!claimed.has(category.slug)) {
      flag('errors', 'MISSING_CATEGORY', `No tab in the sheet supplies ${category.name}.`)
    }
  }

  for (const [tab, category] of pairs) {
    const raw = workbook[tab]
    const columns = locateColumns(raw[0], tab)
    if (!columns) continue

    for (const cells of raw.slice(1)) {
      if (!cells.some((v) => v !== null && v !== undefined && String(v).trim() !== '')) continue

      const row = { category }
      for (const [key, at] of Object.entries(columns)) {
        row[key] = cells[at] ?? null
      }

      // The sheet contains a handful of byte-identical duplicated rows.
      const fingerprint = `${tab}|${cells.join('\u0000')}`
      if (seen.has(fingerprint)) {
        flag('warnings', 'DUPLICATE_ROW', `Duplicate row in "${tab}" — SKU ${clean(row.sku)}.`)
        continue
      }
      seen.add(fingerprint)
      rows.push(row)
    }
  }
  return rows
}

/**
 * A "design" is one physical piece; its variants are the metal colours it is
 * offered in. The business already encodes this in the SKU: 17HEW = design
 * 17HE, colour W. Titles are NOT unique (two different hoop designs share the
 * name "Marquise Hoops Earrings"), so the SKU is the only safe grouping key.
 */
function toVariant(row) {
  const sku = clean(row.sku).toUpperCase()
  const parsed = sku.match(/^(\d+)([A-Z]{2,3})([WYR])$/)
  if (!parsed) {
    flag('errors', 'BAD_SKU', `SKU "${sku}" does not follow the <number><type><colour> pattern.`)
    return null
  }

  // IMAGE 1 and IMAGE 2 are separate columns now; either may hold more than one
  // link, and the same photo often appears in both.
  const ids = [...new Set([...driveIds(row.image1), ...driveIds(row.image2)])]
  if (!ids.length) {
    flag('errors', 'MISSING_IMAGE', `SKU ${sku} has no usable image link.`)
  }
  const [id = ''] = ids

  const colour = metalColour(row.metalColour)
  if (!colour) {
    flag('warnings', 'UNKNOWN_METAL_COLOUR', `SKU ${sku} has metal colour "${clean(row.metalColour)}".`)
  }

  const price = round(row.price, 2)
  if (price === null || price <= 0) {
    flag('errors', 'MISSING_PRICE', `SKU ${sku} has no usable price.`)
  }

  return {
    designId: `${parsed[1]}${parsed[2]}`,
    sku,
    title: tidy(row.title),
    metalColour: colour || 'White',
    metal: metalName(row.metal) || '14K Gold',
    price,
    carat: round(row.carat, 2),
    minCarat: round(row.minCarat, 2),
    diamondCount: round(row.diamondCount, 0),
    metalWeight: round(row.metalWeight, 3),
    shape: tidy(row.shape),
    colour: tidy(row.colour),
    clarity: tidy(row.clarity),
    origin: tidy(row.origin),
    designType: tidy(row.designType),
    size: size(row.size),
    imageId: id,
    image: id ? imageUrl(id, 1600) : null,
    thumbnail: id ? imageUrl(id, 800) : null,
    gallery: ids.map((each) => ({ id: each, full: imageUrl(each, 1600), thumb: imageUrl(each, 800) })),
    // VIDEO 1 exists in the sheet but is empty everywhere so far. Carried
    // through so a link starts working the day one is pasted in.
    video: driveIds(row.video)[0] ?? null,
  }
}

function buildDesigns(rows) {
  const groups = new Map()

  for (const row of rows) {
    const variant = toVariant(row)
    if (!variant) continue
    const key = `${row.category.slug}/${variant.designId}`
    if (!groups.has(key)) groups.set(key, { category: row.category, variants: [] })
    groups.get(key).variants.push(variant)
  }

  const designs = []
  const slugs = new Set()

  for (const [key, { category, variants }] of groups) {
    // Show White first — it photographs as the "default" for most of the range.
    const order = { White: 0, Yellow: 1, Rose: 2 }
    variants.sort((a, b) => (order[a.metalColour] ?? 9) - (order[b.metalColour] ?? 9))
    const lead = variants[0]

    const titles = [...new Set(variants.map((v) => v.title))]
    if (titles.length > 1) {
      flag(
        'warnings',
        'TITLE_MISMATCH',
        `Design ${key} has different titles per colour: ${titles.join(' / ')}.`,
        'The metal colours may actually be different carat weights sharing one SKU number.',
      )
    }

    const images = variants.map((v) => v.imageId).filter(Boolean)
    if (images.length > 1 && new Set(images).size === 1) {
      flag('notes', 'SHARED_IMAGE', `Design ${key} uses one photo for all metal colours.`)
    }

    let slug = slugify(`${lead.title}-${lead.designId}`)
    if (slugs.has(slug)) slug = `${slug}-${slugs.size}`
    slugs.add(slug)

    const prices = variants.map((v) => v.price).filter((p) => typeof p === 'number')
    const carats = variants.map((v) => v.carat).filter((c) => typeof c === 'number')

    designs.push({
      id: lead.designId,
      slug,
      title: lead.title,
      category: category.name,
      categorySlug: category.slug,
      designType: lead.designType,
      shape: lead.shape,
      metal: lead.metal,
      colour: lead.colour,
      clarity: lead.clarity,
      origin: lead.origin,
      size: lead.size,
      carat: lead.carat,
      minCarat: lead.minCarat,
      diamondCount: lead.diamondCount,
      metalColours: [...new Set(variants.map((v) => v.metalColour))],
      priceFrom: prices.length ? Math.min(...prices) : null,
      priceTo: prices.length ? Math.max(...prices) : null,
      caratFrom: carats.length ? Math.min(...carats) : null,
      image: lead.image,
      thumbnail: lead.thumbnail,
      variants,
    })
  }

  // Cross-design image reuse means a photo is very likely on the wrong product.
  const byImage = new Map()
  for (const d of designs) {
    for (const v of d.variants) {
      if (!v.imageId) continue
      if (!byImage.has(v.imageId)) byImage.set(v.imageId, [])
      byImage.get(v.imageId).push(`${d.id} ${v.sku}`)
    }
  }
  for (const [id, skus] of byImage) {
    const designIds = new Set(skus.map((s) => s.split(' ')[0]))
    if (designIds.size > 1) {
      flag(
        'errors',
        'IMAGE_ON_MULTIPLE_DESIGNS',
        `One photo is used by unrelated designs: ${skus.join(', ')}.`,
        `https://drive.google.com/file/d/${id}/view`,
      )
    }
  }

  designs.sort(
    (a, b) =>
      a.categorySlug.localeCompare(b.categorySlug) ||
      (b.priceFrom ?? 0) - (a.priceFrom ?? 0) ||
      a.title.localeCompare(b.title),
  )
  return designs
}

// --- write -----------------------------------------------------------------

async function main() {
  const workbook = await loadWorkbook()
  const rows = readRows(workbook)
  const designs = buildDesigns(rows)

  if (!designs.length) throw new Error('No products parsed — refusing to overwrite the catalogue.')

  /**
   * Refuse to publish a catalogue that parsed but is obviously wrong.
   *
   * When IMAGE 2 and VIDEO 1 were inserted into the sheet, every later column
   * shifted and the parse produced 369 SKUs with no price and no photo. The
   * health report caught it — and the pipeline committed and deployed it
   * regardless, because nothing was checking. Detection without a stop is not
   * a safeguard. Throwing here hands over to the fallback in main()'s catch,
   * which keeps the last good catalogue: stale beats wrong.
   */
  const variants = designs.flatMap((d) => d.variants)
  const priced = variants.filter((v) => typeof v.price === 'number' && v.price > 0).length
  const pictured = variants.filter((v) => v.imageId).length
  const worst = Math.min(priced, pictured) / variants.length

  if (worst < 0.8) {
    throw new Error(
      `Only ${priced}/${variants.length} SKUs have a price and ${pictured}/${variants.length} ` +
        `have a photo. That is a parsing failure, not a data-entry gap — most likely the ` +
        `sheet's columns moved. Refusing to publish it.`,
    )
  }

  // Only name and slug reach the site — `match` is a parsing detail.
  const categories = CATEGORIES.map(({ name, slug }) => ({
    name,
    slug,
    count: designs.filter((d) => d.categorySlug === slug).length,
  })).filter((c) => c.count > 0)

  const prices = designs.flatMap((d) => d.variants.map((v) => v.price)).filter(Boolean)
  const catalogue = {
    generatedAt: new Date().toISOString(),
    source: { sheetId: SHEET_ID || null },
    stats: {
      designs: designs.length,
      skus: designs.reduce((n, d) => n + d.variants.length, 0),
      categories: categories.length,
      priceFrom: Math.min(...prices),
      priceTo: Math.max(...prices),
    },
    filters: {
      shapes: [...new Set(designs.map((d) => d.shape).filter(Boolean))].sort(),
      metalColours: [...new Set(designs.flatMap((d) => d.metalColours))].sort(),
      sizes: [...new Set(designs.map((d) => d.size).filter(Boolean))].sort(),
    },
    categories,
    designs,
  }

  await mkdir(resolve(ROOT, 'data'), { recursive: true })
  await writeFile(resolve(ROOT, 'data/products.json'), JSON.stringify(catalogue, null, 2) + '\n')
  await writeFile(
    resolve(ROOT, 'data/data-health.json'),
    JSON.stringify({ checkedAt: catalogue.generatedAt, ...health }, null, 2) + '\n',
  )

  console.log(
    `\n${catalogue.stats.designs} designs / ${catalogue.stats.skus} SKUs across ` +
      `${categories.length} categories.`,
  )
  for (const c of categories) console.log(`  ${c.name.padEnd(16)} ${String(c.count).padStart(3)}`)

  console.log(
    `\nData health: ${health.errors.length} error(s), ${health.warnings.length} warning(s), ` +
      `${health.notes.length} note(s) — see data/data-health.json`,
  )
  for (const e of health.errors.slice(0, 10)) console.log(`  ERROR  ${e.message}`)
  for (const w of health.warnings.slice(0, 5)) console.log(`  WARN   ${w.message}`)
}

main().catch(async (err) => {
  console.error(`\nSync failed: ${err.message}`)

  // The catalogue is committed, and the deploy build runs this script first.
  // Failing hard would mean a Drive blip blocks every deploy, including ones
  // that have nothing to do with the data. Keeping the last good catalogue is
  // the safer trade: the site goes stale, loudly, instead of going down.
  try {
    await readFile(resolve(ROOT, 'data/products.json'))
    console.error(
      'Keeping the committed catalogue — the site will build with the last ' +
        'good data. Fix the sheet and re-run to refresh it.',
    )
    process.exit(0)
  } catch {
    console.error('No committed catalogue to fall back on.')
    process.exit(1)
  }
})
