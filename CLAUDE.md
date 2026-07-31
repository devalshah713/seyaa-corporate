# Seyaa Jewels — corporate jewellery showcase

A catalogue site for lab-grown diamond jewellery. It **showcases** pieces —
there is no cart and nothing is sold online. Buyers note a SKU and enquire.

## The source of truth is a Google Sheet

Everything on the site comes from one spreadsheet. Nothing is hand-authored.

- **Sheet:** `JEWELERY PORTAL` — file id `1Dw4N0s3shF_hnNUWjcCN_ppfLtq1os9U`
- **Owner:** `seyaalabjewel@gmail.com`
- **Sharing:** *Anyone with the link can view* — **this must stay true**, or the
  daily sync breaks. It is what lets the sync run without credentials.
- **Photography:** individual Drive files owned by `samkitgems713@gmail.com`,
  also shared publicly, named by SKU (`5BRW.png`). They are hot-linked through
  `drive.google.com/thumbnail?id=…`, so **adding a photo to Drive and pasting
  its link into the sheet is all it takes to publish an image.**

New products are added to the sheet daily. To refresh the catalogue:

```bash
npm run sync          # download the sheet, rebuild data/products.json
npm run sync -- --file some.xlsx   # parse a local copy instead
```

`.github/workflows/sync-catalogue.yml` runs this every morning at 05:00 UTC and
commits any change, which redeploys the site.

## The sheet's headers are wrong — do not trust them

The header row is mislabelled and shifted. `scripts/sync-sheet.mjs` maps columns
**by position**, and that mapping is the authority:

| Col | Header says | Actually holds |
| --- | --- | --- |
| A | Title | Title |
| B | description | **Metal colour** (`14K WHITE` / `14K YELLOW` / `14K ROSE`) |
| C | SKU | SKU |
| D | Metal | *always empty* |
| E | jewelry image1 | **The metal** — literally `14K GOLD` on every row |
| F | gallery | **The image link(s)** |
| G–J | — | Total carat, min carat, shape, stone count |
| K | Each diamond size (mm) | *always empty* |
| L–N | — | Colour, clarity, metal weight |
| O | Design type | Category (`Bracelet`, `Hoops`, …) |
| P | Metal length | **Size** (`7 INCH`, `US 7`, `16.5 INCH`, `NA`) |
| Q | Type | *always empty* |
| R–S | — | Price (USD), origin |

Six tabs — `Bracelets`, `Hoops Earrings`, `Studs`, `Rings`, `Necklaces`,
`Pendants` — each with the same layout. The tab is what determines the category.

## Products are grouped by SKU, never by title

A SKU is `<number><type><colour>`: `17HEW` = design `17HE` in **W**hite gold.
One design = one product page, with a metal-colour toggle across its variants.

**Titles are not unique** — two unrelated hoop designs are both called
"Marquise Hoops Earrings" — so grouping by title silently merges different
products. Always group on the SKU prefix.

## Data health

`npm run sync` also writes `data/data-health.json` and prints a summary. It
reports problems in the *source sheet* for the team to fix — it never silently
"corrects" them. Known open issues at last sync:

- 10 photos are shared by unrelated designs (a photo is on the wrong product).
- Three hoop designs give different titles to their White and Yellow rows,
  suggesting two carat weights share one SKU number.

Normalisation that *is* applied automatically: byte-identical duplicate rows are
dropped, `16.5 NCH` → `16.5 INCH`, `14KT`/`14K` casing is unified, trailing
spaces are trimmed, float noise (`633.0600000000001`) is rounded, and multiple
links in one gallery cell are split into a real image gallery.

## Stack

Next.js (App Router, SSG) + Tailwind. Every product page is prerendered.

- `scripts/sync-sheet.mjs` — sheet → `data/products.json`
- `scripts/lib/xlsx.mjs` — a small dependency-free `.xlsx` reader. Deliberate:
  the maintained spreadsheet libraries on npm carry unpatched advisories, and
  this code runs unattended in CI. It is validated against openpyxl.
- `src/lib/catalogue.ts` — typed access plus the plain-English glossary
- Theme: `:root` in `globals.css` is the white brand palette; setting
  `data-theme="charcoal"` on `<html>` flips the whole site. White is the
  default **because every packshot is shot on pure white** — on a dark ground
  they render as glaring white tiles.

## Brand

The brand kit (`SeyaaJewels-Brand Kit.pdf`) specifies, in full:

- **Palette:** `#FFFFFF` and `#DD611C` — only those two. `#1C2120` near-black
  is the kit's own ground and is used here for body text.
- **Typefaces:** **Montserrat** for headings and body, **Allura** for the
  wordmark. Both load through `next/font/google`, which subsets and self-hosts
  them at build time — no font-CDN request at runtime, no layout shift.
- **Logo:** a rearing horse holding a diamond, above the wordmark.
- **Tagline:** "LAB GROWN DIAMOND JEWELLERY", letter-spaced uppercase.

The page surface is `#FFFFFF` because that is the brand white *and* the ground
every packshot is shot on — the two requirements agree.

The supplied logo is white artwork on a solid orange field with no alpha.
Because the artwork is pure white composited over a known background, the
original alpha is exactly recoverable per pixel — that is how `mark.webp` was
derived rather than traced. The wordmark needs no asset at all: it is set live
in Allura, the brand's own typeface.

| Asset | Use |
| --- | --- |
| `mark.webp` | the horse, orange on transparent — the only logo file |
| `brightness(0) invert(1)` on it | white mark for the orange footer |
| `og.jpg` | 1200×630 social card, the brand lockup |
| `src/app/icon.png`, `apple-icon.png` | white mark on orange, per the brand kit |

**Two orange tokens, and the distinction matters.** `#DD611C` on white is
3.4:1 — fine at display size, but it fails WCAG AA for body text, and white
on it is only 3.6:1. So:

- `--brand` (`#DD611C`) — the true brand orange. Logo, the `.rule-gold`
  divider, the hero accent, large numerals. Never body-size text.
- `--accent` (`#B54D17`) — a deeper cut of the same hue for buttons and links.
  White on it is 4.8:1; as text on white it is 5.0:1. Both clear AA.

Use `text-brand` only where the type is genuinely large; `text-gold-soft`
(which maps to `--accent`) everywhere else.

`--image-well` is set to pure white so a packshot dissolves into its tile and
the hairline alone defines the edge.

## House style

- Prices are shown publicly, in whole dollars.
- Trade grading is always paired with plain English (`E-F` → "Colourless").
  That mapping lives in `PLAIN_ENGLISH` in `src/lib/catalogue.ts`.
- Product images use `object-contain`, never `cover` — cropping a solitaire out
  of frame misrepresents the piece.
- British spelling in copy ("colour", "jewellery").
