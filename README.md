# Seyaa Jewels — Lab Grown Diamond Jewellery

A showcase catalogue of 14K gold lab-grown diamond jewellery for corporate
partners. Photos, full specifications and prices — no cart, no checkout.
Buyers note a SKU and enquire.

**196 designs · 368 SKUs · 6 categories**

---

## How it works

The site has no CMS. One Google Sheet is the source of truth, and the product
photographs live in Google Drive. Add a row to the sheet, paste the Drive link
to the photo, and the piece appears on the site within the hour.

```
Google Sheet  ──►  npm run sync  ──►  data/products.json  ──►  Next.js build
   (hourly)         (GitHub Action)                             (Vercel)
```

Both the sheet and the photos are shared as *anyone with the link can view*, so
the sync needs no credentials or API keys.

> **Keep the sheet shared.** If link-sharing is turned off, the sync
> fails with a clear error and the site simply keeps serving the last good
> catalogue.

**Which sheet is configuration, not code.** The Drive file id lives in the
`SHEET_ID` environment variable, never in this repository — the repository is
public, and the link grants read access to the entire price list. Set it in two
places:

- **Vercel →** Settings → Environment Variables → `SHEET_ID`, so each deploy
  pulls the sheet.
- **GitHub →** Settings → Secrets and variables → Actions → *Variables* →
  `SHEET_ID`, so the hourly job pulls it too.

With it unset the sync reports that it has nothing to pull, commits nothing and
exits cleanly; the site keeps serving the committed catalogue. Repointing the
site at a different sheet is a change to those two values and nothing else.

## Everyday tasks

```bash
npm install

npm run sync     # pull the latest sheet into data/products.json
npm run dev      # local preview at http://localhost:3000
npm run build    # production build (prerenders every product page)
```

The sync also writes `data/data-health.json` — a list of problems found in the
sheet (missing photos, a photo used on two unrelated products, duplicate rows).
It reports them rather than silently patching them, so the source can be fixed.

## Adding products

1. Add a row to the correct tab in the sheet — one row per metal colour.
2. SKU must be `<number><type><colour>`, e.g. `52BRW` (White) and `52BRY`
   (Yellow). The number ties the colours together into one product page.
3. Upload the photo to the shared Drive folder and paste its link into
   **IMAGE 1**. A second angle goes in **IMAGE 2** — the product page then
   becomes a gallery the customer can swipe through, with thumbnails, arrows
   and a counter. (More than one link in a single cell works too.)
4. The site picks it up within the hour, or run the *Sync catalogue*
   workflow from the Actions tab to publish immediately.

Every photo must be shared as *anyone with the link can view*, the same as the
sheet. A photo that is not shared is not a broken build — it is a broken image
on a live product page, which nothing else will catch.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Editorial home — category tiles, statement pieces |
| `/collection` | All designs, filterable by category, metal, shape and price; searchable by name or SKU |
| `/piece/[slug]` | One design: gallery, metal-colour toggle, full specification |
| `/piece/[SKU]` | The same page, by SKU — a link that never goes stale |
| `/guide` | What E–F, VS–SI, carat and "lab grown" actually mean |
| `/enquiry` | The buyer's selected SKUs, ready to send in one message |

## Sharing a link to a piece

A product URL is built from the piece's title, so **editing a title in the sheet
changes its address**. Retitling `19BR` from "18 CTS" to "21 CTS" moved it from
`/piece/18-cts-pear-prong-tennis-bracelet-19br` to `/piece/21-cts-…-19br`.

Old links are not dead — they redirect to the piece's current address, because
the design id at the end of the slug is the stable half. But to send a link that
can never go stale, use the SKU:

```
https://seyaa-showcase.vercel.app/piece/19BRW
```

That redirects to whatever the piece is called today. It is the right thing to
paste into an email or a WhatsApp message.

## Enquiries

A buyer adds SKUs to an enquiry list as they browse, then sends the whole list
to sales in one message — by WhatsApp or email, with every SKU, carat weight,
size and price already written out.

The list is stored in the browser, so it survives a refresh and needs no login.
A SKU is what gets added rather than a design, because metal colour is part of
the SKU and White and Yellow are separate things to quote for.

Enquiries go to **+1 917 801 6060** on WhatsApp and **devalshah713@gmail.com**
by email. To change either, both routes work and the environment wins:

- **Vercel → Settings → Environment Variables →** `NEXT_PUBLIC_WHATSAPP_NUMBER`,
  then redeploy. No code change, and the number can move to a different handset
  without a commit.
- or `WHATSAPP_FALLBACK` in [`src/lib/contact.ts`](./src/lib/contact.ts).

Give it the full international number including country code. Formatting does
not matter — `+1 (555) 987-6543` and `15559876543` both work, since anything
that is not a digit is stripped. A value that is not 8–15 digits is treated as
a typo and ignored, because a wrong number is worse than no button.

If the number is ever cleared or mistyped, every WhatsApp button hides itself
and email becomes the primary action — the site is never broken, just narrower.
`NEXT_PUBLIC_SALES_EMAIL` overrides the address the same way.

WhatsApp buttons appear in three places: on a product page (that one piece), on
the enquiry list (everything selected), and in the footer (a general question).

## Deploying

Vercel, connected to this repository, deploying `main`. `SHEET_ID` must be set
for a deploy to pull fresh data; the WhatsApp number and sales address above are
optional overrides. The build command is:

```
node scripts/sync-sheet.mjs && next build
```

so every deploy pulls the sheet fresh rather than shipping whatever was last
committed. If the download fails, the sync says so and exits cleanly, and the
build carries on with the committed `data/products.json` — the site goes stale,
loudly, rather than a Drive outage blocking an unrelated deploy.

Two paths therefore keep the site current, and either alone is enough:

```
sheet edited  ─►  hourly Action runs     ─►  commits data/  ─►  Vercel redeploys
any push      ─────────────────────────────────────────────►  Vercel redeploys
                                                              (re-syncs on the way)
```

Two things decide whether that loop actually closes, and the first one bit
once already:

- **The sync has to land on the branch Vercel deploys.** A scheduled workflow
  runs from the repository's *default* branch, which is not necessarily the
  deployed one — the first nightly run committed to a stale feature branch and
  never reached the site. The workflow now checks out and pushes to `main`
  explicitly (`DEPLOY_BRANCH`), so the default-branch setting cannot break it.
- **Vercel only builds on a push.** Connecting the repository does not deploy
  anything by itself — until a commit lands, the project reads "No Production
  Deployment".

Product images are optimised and cached by Next.js at the edge, so visitors
never wait on Drive for a 1.3 MB PNG.

## Notes for developers

See [`CLAUDE.md`](./CLAUDE.md) for the column mapping (the sheet's headers are
mislabelled and must not be trusted), the SKU grouping rules, and the brand
palette and typography.
