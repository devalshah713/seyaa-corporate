# Seyaa Jewels — corporate jewellery showcase

A catalogue site for lab-grown diamond jewellery. It **showcases** pieces —
there is no cart and nothing is sold online. Buyers note a SKU and enquire.

## The source of truth is a Google Sheet

Everything on the site comes from one spreadsheet. Nothing is hand-authored.

- **Sheet:** set by the `SHEET_ID` environment variable — the Drive file id of
  the master sheet. It is deliberately **not** committed: the repository is
  public, and the link grants read access to the whole price list. Set it in
  Vercel and as a GitHub Actions repository variable of the same name.
  Unset, the sync does nothing and the committed catalogue stands.
- **Sharing:** *Anyone with the link can view* — **this must stay true**, or the
  hourly sync breaks. It is what lets the sync run without credentials, and it
  is also why the id belongs in configuration rather than in the source.
- **Photography:** individual Drive files owned by `samkitgems713@gmail.com`,
  also shared publicly, named by SKU (`5BRW.png`). They are hot-linked through
  `drive.google.com/thumbnail?id=…`, so **adding a photo to Drive and pasting
  its link into the sheet is all it takes to publish an image.**

New products are added to the sheet daily. To refresh the catalogue:

```bash
npm run sync          # download the sheet, rebuild data/products.json
npm run sync -- --file some.xlsx   # parse a local copy instead
```

`.github/workflows/sync-catalogue.yml` runs this on a schedule and commits any
change, which redeploys the site. It was daily until an edit made during the
working day sat invisible until the next morning and read as a broken site.
The commit step exits early when nothing changed, so a quiet run costs one
short job and no deploy.

**The schedule is currently commented out.** From 16:04 UTC on 6 Aug every run
— scheduled and manually dispatched alike — sat queued for fifteen minutes
without being given a runner and was then cancelled, which GitHub emails to the
repo owner as "Run failed". Nothing in the workflow causes that and nothing in
it can fix it; the job never starts, so `timeout-minutes` never applies either.
Re-enable the two `schedule` lines once `SHEET_ID` is set and Actions is
healthy. Until `SHEET_ID` is set the job has nothing to pull anyway.

Losing it costs less than it sounds: `npm run build` runs the same sync, so
every Vercel deploy pulls the sheet fresh. The schedule only decides how often
a deploy is *triggered*.

The push also rebases and retries: the job checks out `main` and pushes minutes
later, and a rejected push is not a reason to lose a good sync.

## Columns are found by header, never by position

The sheet was restructured on 1 Aug 2026: the old mislabelled headers were
corrected, and `IMAGE 2` and `VIDEO 1` were inserted, shifting every later
column one place right. The positional map read prices out of the metal-weight
column and published 369 SKUs with no price and no photo.

`scripts/sync-sheet.mjs` now locates each column by matching its header, so
inserts and reordering are harmless. `description` is the one header still not
to be trusted — it holds the metal colour.

| Header | Holds |
| --- | --- |
| Title | Title |
| description | **Metal colour** (`14K WHITE` / `14K YELLOW` / `14K ROSE`) |
| SKU | SKU |
| Metal | `14K GOLD` |
| IMAGE 1 / IMAGE 2 | Image link(s); either may hold more than one |
| VIDEO 1 | Video link — present but empty everywhere so far, and no UI yet |
| Total Diamonds weight … origin | Carat, min carat, shape, count, colour, clarity, metal weight, design type, size, price, origin |

Tabs are matched by pattern too (`Hoops Earrings` became `Earrings` once and
took a whole category off the site). A tab matching nothing, or a missing
required column, is reported by name rather than silently skipped.

**Two guards keep a bad parse off the site.** A tab whose required columns are
missing is skipped with a named error; and if fewer than 80% of SKUs end up
with both a price and a photo, the sync refuses to publish at all and the build
falls back to the committed catalogue. Reporting alone was not enough — the
738-error run was detected and deployed anyway.

## Products are grouped by SKU, never by title

A SKU is `<number><type><colour>`: `17HEW` = design `17HE` in **W**hite gold.
One design = one product page, with a metal-colour toggle across its variants.

**Titles are not unique** — two unrelated hoop designs are both called
"Marquise Hoops Earrings" — so grouping by title silently merges different
products. Always group on the SKU prefix.

**Titles are not stable either, and the slug is built from one.** `19BR` was
retitled "18 CTS" → "21 CTS" in the sheet and every link a seller had already
sent started 404ing. An unknown `/piece/*` slug is therefore resolved by its
last segment — the design id — and redirected to the current address
(`findByIdentifier`); a SKU resolves the same way, which makes `/piece/19BRW` a
permanent address worth sharing. The redirect is 307, not 308: a title can
change back, and a permanent redirect would be cached in the browser past that.

## Sub-categories are parsed out of the title

The sheet has no column for them. `Design type` only repeats the category
("Bracelet" on every bracelet row) and `Type` is empty throughout, so the only
place the distinction exists is the title a human wrote — "Tennis Bracelet",
"Martini Setting", "Eternity Band". `SUBCATEGORIES` in `sync-sheet.mjs` is the
one table to change if a real column ever appears.

First match wins, so order is precedence: a "Cushion Solitaire Halo Ring" is a
halo before it is a solitaire. Anything unmatched falls to "Other" and is
reported by name — a new product line should surface as a gap to name, not
vanish into a bucket nobody reads. All 191 designs currently classify.

| Category | Shelves |
| --- | --- |
| Bracelets | Tennis · Fancy & Mixed · Bangles & Cuffs |
| Stud Earrings | Basket Setting · Martini Setting |
| Earrings | Hoops · Drops & Danglers · Halo & Fancy Studs · Shaped |
| Rings | Eternity Bands · Halo · Solitaire · Fancy · Classic |
| Necklaces | Tennis · Statement |
| Pendants | Hip-Hop & Character · Solitaire · Symbols & Letters · Fancy & Mixed · Classic Diamond |

They surface in four places: named on the home page under each category tile,
as a chip row above the collection grid, nested under their parent in the
filter panel, and in the product breadcrumb.

**Diamond shape is the third level**, shown as a quieter row beneath the
shelves — it refines a shelf rather than choosing one. It is derived from the
pieces on the open shelf, with live counts, and rendered only when there is a
real choice: half the shelves hold a single shape (every stud is round), and
offering one option is worse than offering none. Tennis bracelets span seven,
which is where it earns its place. Moving shelf keeps the chosen shape only if
the new shelf has it, so a customer is never dropped onto an empty grid.

**Setting is the fourth**, on the same terms — `Prong` / `Bezel`, read out of
the title by `readSetting` because the sheet has no column for it either.

The two refinements are counted against each other, not just against the shelf:
choosing Bezel narrows the shapes on offer to the ones that come in bezel, so
no option ever returns nothing. Each facet is excluded from its own count,
which is what keeps its alternatives visible once one is picked.

Eleven of the forty tennis bracelets — the plain round line — do not state a
setting, so they are reachable under "Any" and nowhere else. That is a gap in
the source, not something to show a customer, so there is no "Not specified"
option; `SETTING_NOT_STATED` lists the pieces by name for the team instead.

`?category=…&type=…&shape=…&setting=…` makes any level a shareable link.

**The URL is written from the handlers and read back by an effect, and the
direction matters.** Writing it from an effect on the state was wrong: an
effect also fires on mount, and mid-transition `usePathname()` can still report
the page being navigated away from, which rewrote a freshly-opened
`/collection?category=…` back to `/`. Only a real interaction may write.

Reading it, though, has to be an effect. `useState(params.get(…))` initialises
once, and a header link to `/collection?category=rings` is a client-side
navigation to the route the browser is *already* on — nothing remounts, so
nothing re-reads. Tapping "Rings" from a filtered hoop-earrings view left the
address on rings and the page on hoop earrings. Following the address can never
fight a navigation, so that direction is safe.

## Data health

`npm run sync` also writes `data/data-health.json` and prints a summary. It
reports problems in the *source sheet* for the team to fix — it never silently
"corrects" them. Known open issues at last sync:

- One photo (`1BYvT29…`) sits in `IMAGE 1` for five SKUs across three unrelated
  designs — 21BRY, 22BRW, 22BRY, 23BRW, 23BRY, the 2/3/4 CTS Round Tennis
  Bracelets. Their `IMAGE 2` values are all distinct, so it is the first photo
  that was copy-pasted, and `IMAGE 1` is what the collection grid shows.
- `24HE` still gives different titles to its White and Yellow rows, suggesting
  two carat weights share one SKU number.

Every SKU has a price in the sheet (not published), and most carry a second
photograph.

**One value is overridden rather than reported.** Every row's `Diamonds clarity`
reads `VS-SI` while the grade actually supplied is `VVS-VS`, so
`CLARITY_OVERRIDE` in `sync-sheet.mjs` rewrites it on the way through and
raises a `CLARITY_OVERRIDDEN` warning on every run. This is a correction, not a
normalisation, and it belongs in the sheet — a clarity grade is a quality claim
made to a trade buyer. Delete the override the day the column is fixed, and
before any stock genuinely graded `VS-SI` is listed.

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
- `src/components/PieceGallery.tsx` — the swipeable product gallery. Movement is
  native CSS scroll-snap (`.swipe-track`), never a JS gesture handler: that buys
  the platform's own momentum and, critically, lets a drag that starts out
  vertical scroll the page instead of being swallowed by the carousel. The
  active index is *derived from* `scrollLeft` rather than stored alongside it,
  so the thumbnails and counter cannot disagree with what is on screen. Remount
  it (`key={variant.sku}`) when the metal colour changes so the scroll position
  does not carry over to a different set of photographs.
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

## Enquiries

`src/lib/enquiry.ts` holds the buyer's selection in `localStorage` and builds
the plain-text message sent to sales. Items are keyed by **SKU, not design** —
metal colour is part of the SKU, so White and Yellow are separately quotable.

Sales contact details live in exactly one place, `src/lib/contact.ts`, and can
be overridden from the environment (`NEXT_PUBLIC_WHATSAPP_NUMBER`,
`NEXT_PUBLIC_SALES_EMAIL`) so the number can change without a commit. Input is
stripped to digits, so any human formatting works; anything not 8–15 digits is
rejected and every WhatsApp button hides itself rather than linking somewhere
broken.

`whatsappHref()` builds the `wa.me` deep link that opens the chat with the
message already typed. It is used in three places: one piece on a product page,
the whole selection on `/enquiry`, and a general question in the footer.

Anything that depends on stored state must wait for the hook's `ready` flag
before rendering, or the server's empty list and the client's restored one
disagree on first paint.

## House style

- **Prices are not published.** Every piece reads "Price on request".
  They are stripped in `sync-sheet.mjs` on the way into `data/products.json`,
  not hidden in the components — the catalogue file is committed to a public
  repository and bundled into the pages the browser downloads, so a number that
  reaches it is readable whatever the markup says. The price filter and the
  price sorts are gone for the same reason: a working price band is a way to
  read a price off a catalogue that hides them.
  Prices are still *parsed*, because the publish guard needs them: a collapse in
  how many rows carry one is the signal that the sheet's columns have moved.
- Trade grading is always paired with plain English (`E-F` → "Colourless").
  That mapping lives in `PLAIN_ENGLISH` in `src/lib/catalogue.ts`.
- Product images use `object-contain`, never `cover` — cropping a solitaire out
  of frame misrepresents the piece.
- British spelling in copy ("colour", "jewellery").
