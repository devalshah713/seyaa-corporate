/**
 * Minimal, dependency-free .xlsx reader.
 *
 * An .xlsx file is a ZIP archive of XML parts. Node can inflate them natively,
 * and the sheet we consume holds nothing but strings and numbers — so a full
 * spreadsheet library is not worth the supply-chain surface (the popular ones
 * carry unpatched advisories and this code runs unattended in CI).
 *
 * Supports what the catalogue actually needs: shared strings (including rich
 * text runs), inline strings, formula results, numbers, and sparse rows.
 */

import { inflateRawSync } from 'node:zlib'

// --- ZIP ------------------------------------------------------------------

const EOCD_SIGNATURE = 0x06054b50
const CENTRAL_FILE_SIGNATURE = 0x02014b50

/** Reads a ZIP central directory and returns { filename -> Buffer }. */
export function unzip(buffer) {
  // The end-of-central-directory record sits at the tail, after an optional
  // comment of up to 64 KB, so scan backwards for its signature.
  let eocd = -1
  const earliest = Math.max(0, buffer.length - 0xffff - 22)
  for (let i = buffer.length - 22; i >= earliest; i--) {
    if (buffer.readUInt32LE(i) === EOCD_SIGNATURE) {
      eocd = i
      break
    }
  }
  if (eocd === -1) throw new Error('Not a valid .xlsx file (no ZIP end-of-central-directory record).')

  const entryCount = buffer.readUInt16LE(eocd + 10)
  let offset = buffer.readUInt32LE(eocd + 16)
  const files = new Map()

  for (let i = 0; i < entryCount; i++) {
    if (buffer.readUInt32LE(offset) !== CENTRAL_FILE_SIGNATURE) {
      throw new Error('Corrupt .xlsx: unexpected data in the ZIP central directory.')
    }
    const method = buffer.readUInt16LE(offset + 10)
    const compressedSize = buffer.readUInt32LE(offset + 20)
    const nameLength = buffer.readUInt16LE(offset + 28)
    const extraLength = buffer.readUInt16LE(offset + 30)
    const commentLength = buffer.readUInt16LE(offset + 32)
    const localOffset = buffer.readUInt32LE(offset + 42)
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLength)

    // The local header repeats the name and may carry a different extra field,
    // so the payload offset must be computed from the local header itself.
    const localNameLength = buffer.readUInt16LE(localOffset + 26)
    const localExtraLength = buffer.readUInt16LE(localOffset + 28)
    const start = localOffset + 30 + localNameLength + localExtraLength
    const payload = buffer.subarray(start, start + compressedSize)

    if (method === 0) files.set(name, payload)
    else if (method === 8) files.set(name, inflateRawSync(payload))
    else throw new Error(`Unsupported ZIP compression method ${method} for "${name}".`)

    offset += 46 + nameLength + extraLength + commentLength
  }
  return files
}

// --- XML ------------------------------------------------------------------

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

function decodeXml(text) {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-z]+);/g, (match, code) => {
    if (code[0] === '#') {
      const value = code[1] === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(value) ? String.fromCodePoint(value) : match
    }
    return ENTITIES[code] ?? match
  })
}

/** Concatenates every <t> in a fragment — rich text splits one string into runs. */
function textOf(fragment) {
  let out = ''
  for (const match of fragment.matchAll(/<t(?:\s[^>]*)?(?:\/>|>([\s\S]*?)<\/t>)/g)) {
    out += decodeXml(match[1] ?? '')
  }
  return out
}

/** "BC" -> 54. Excel column letters are base-26 with no zero. */
function columnIndex(ref) {
  const letters = ref.match(/^[A-Z]+/)?.[0] ?? 'A'
  let n = 0
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

// --- workbook -------------------------------------------------------------

function readSharedStrings(files) {
  const part = files.get('xl/sharedStrings.xml')
  if (!part) return []
  const xml = part.toString('utf8')
  return [...xml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]))
}

function readSheetIndex(files) {
  const workbook = files.get('xl/workbook.xml')?.toString('utf8')
  if (!workbook) throw new Error('Corrupt .xlsx: xl/workbook.xml is missing.')

  const rels = files.get('xl/_rels/workbook.xml.rels')?.toString('utf8') ?? ''
  const target = new Map()
  for (const m of rels.matchAll(/<Relationship\b[^>]*\/>/g)) {
    const id = m[0].match(/Id="([^"]+)"/)?.[1]
    const path = m[0].match(/Target="([^"]+)"/)?.[1]
    if (id && path) target.set(id, path.replace(/^\/?(xl\/)?/, ''))
  }

  const sheets = []
  for (const m of workbook.matchAll(/<sheet\b[^>]*\/>/g)) {
    const name = m[0].match(/name="([^"]*)"/)?.[1]
    const rid = m[0].match(/r:id="([^"]+)"/)?.[1]
    if (!name) continue
    sheets.push({ name: decodeXml(name), path: `xl/${target.get(rid) ?? `worksheets/sheet${sheets.length + 1}.xml`}` })
  }
  return sheets
}

function readSheetRows(xml, strings) {
  const rows = []
  for (const rowMatch of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const cells = []
    let widest = 0

    for (const cellMatch of rowMatch[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cellMatch[1]
      const body = cellMatch[2] ?? ''
      const ref = attrs.match(/r="([A-Z]+)\d+"/)?.[1]
      const index = ref ? columnIndex(ref) : widest
      const type = attrs.match(/t="([^"]+)"/)?.[1] ?? 'n'

      let value = null
      if (type === 's') {
        const i = Number(body.match(/<v>([\s\S]*?)<\/v>/)?.[1])
        value = strings[i] ?? null
      } else if (type === 'inlineStr') {
        value = textOf(body) || null
      } else if (type === 'str') {
        value = decodeXml(body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? '') || null
      } else if (type === 'b') {
        value = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] === '1'
      } else {
        const raw = body.match(/<v>([\s\S]*?)<\/v>/)?.[1]
        if (raw !== undefined && raw !== '') {
          const n = Number(raw)
          value = Number.isNaN(n) ? raw : n
        }
      }

      cells[index] = value
      widest = index + 1
    }

    // A sparse row leaves holes; normalise them to null so column positions hold.
    for (let i = 0; i < widest; i++) if (cells[i] === undefined) cells[i] = null
    rows.push(cells)
  }
  return rows
}

/**
 * Parses an .xlsx buffer into { "Tab name": [[cell, ...], ...] }.
 * Cell values are strings, numbers, booleans or null.
 */
export function readWorkbook(buffer) {
  const files = unzip(buffer)
  const strings = readSharedStrings(files)
  const sheets = {}

  for (const { name, path } of readSheetIndex(files)) {
    const part = files.get(path)
    sheets[name] = part ? readSheetRows(part.toString('utf8'), strings) : []
  }
  return sheets
}
