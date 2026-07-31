# Seyaa Jewels — Lab Grown Diamond Jewellery

A showcase catalogue of 14K gold lab-grown diamond jewellery for corporate
partners. Photos, full specifications and prices — no cart, no checkout.
Buyers note a SKU and enquire.

**199 designs · 375 SKUs · 6 categories**

---

## How it works

The site has no CMS. One Google Sheet is the source of truth, and the product
photographs live in Google Drive. Add a row to the sheet, paste the Drive link
to the photo, and the piece appears on the site the next morning.

```
Google Sheet  ──►  npm run sync  ──►  data/products.json  ──►  Next.js build
   (daily)          (GitHub Action)                             (Vercel)
```

Both the sheet and the photos are shared as *anyone with the link can view*, so
the sync needs no credentials or API keys.

> **Keep the sheet shared.** If link-sharing is turned off, the daily sync
> fails with a clear error and the site simply keeps serving the last good
> catalogue.

## Everyday tasks

```bash
npm install

npm run sync     # pull the latest sheet into data/products.json
npm run dev      # local preview at http://localhost:3000
npm run build    # production build (prerenders all 199 product pages)
```

The sync also writes `data/data-health.json` — a list of problems found in the
sheet (missing photos, a photo used on two unrelated products, duplicate rows).
It reports them rather than silently patching them, so the source can be fixed.

## Adding products

1. Add a row to the correct tab in the sheet — one row per metal colour.
2. SKU must be `<number><type><colour>`, e.g. `52BRW` (White) and `52BRY`
   (Yellow). The number ties the colours together into one product page.
3. Upload the photo to the shared Drive folder and paste its link into the
   **gallery** column. More than one link in that cell becomes an image gallery.
4. The site updates itself the next morning, or run the *Sync catalogue*
   workflow from the Actions tab to publish immediately.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Editorial home — category tiles, statement pieces |
| `/collection` | All designs, filterable by category, metal, shape and price; searchable by name or SKU |
| `/piece/[slug]` | One design: gallery, metal-colour toggle, full specification |
| `/guide` | What E–F, VS–SI, carat and "lab grown" actually mean |
| `/enquiry` | The buyer's selected SKUs, ready to send in one message |

## Enquiries

A buyer adds SKUs to an enquiry list as they browse, then sends the whole list
to sales in one message — by WhatsApp or email, with every SKU, carat weight,
size and price already written out.

The list is stored in the browser, so it survives a refresh and needs no login.
A SKU is what gets added rather than a design, because metal colour is part of
the SKU and White and Yellow are separate things to quote for.

**One thing to set: the WhatsApp number.** Either works, and the environment
wins:

- **Vercel → Settings → Environment Variables →** `NEXT_PUBLIC_WHATSAPP_NUMBER`,
  then redeploy. No code change, and the number can move to a different handset
  without a commit.
- or `WHATSAPP_FALLBACK` in [`src/lib/contact.ts`](./src/lib/contact.ts).

Give it the full international number including country code. Formatting does
not matter — `+1 (555) 987-6543` and `15559876543` both work, since anything
that is not a digit is stripped. A value that is not 8–15 digits is treated as
a typo and ignored, because a wrong number is worse than no button.

Until a valid number is set, every WhatsApp button hides itself and email
becomes the primary action — the site is never broken, just narrower.
`NEXT_PUBLIC_SALES_EMAIL` overrides the address the same way.

WhatsApp buttons appear in three places: on a product page (that one piece), on
the enquiry list (everything selected), and in the footer (a general question).

## Deploying

Vercel, connected to this repository. The one optional environment variable is
the WhatsApp number above. The build
command is:

```
node scripts/sync-sheet.mjs && next build
```

so every deploy pulls the sheet fresh rather than shipping whatever was last
committed. If the download fails, the sync says so and exits cleanly, and the
build carries on with the committed `data/products.json` — the site goes stale,
loudly, rather than a Drive outage blocking an unrelated deploy.

Two paths therefore keep the site current, and either alone is enough:

```
sheet edited  ─►  05:00 UTC Action runs  ─►  commits data/  ─►  Vercel redeploys
any push      ─────────────────────────────────────────────►  Vercel redeploys
                                                              (re-syncs on the way)
```

Two settings decide whether that loop actually closes:

- **Vercel → Settings → Git → Production Branch** must match the branch the
  Action pushes to. Vercel picks this up from the repository's default branch
  when the project is first imported, so if the default was something else at
  that moment, this needs setting by hand.
- Vercel only builds on a *push*. Connecting the repository does not deploy
  anything on its own — until the next commit lands, the project will read
  "No Production Deployment".

Product images are optimised and cached by Next.js at the edge, so visitors
never wait on Drive for a 1.3 MB PNG.

## Notes for developers

See [`CLAUDE.md`](./CLAUDE.md) for the column mapping (the sheet's headers are
mislabelled and must not be trusted), the SKU grouping rules, and the brand
palette and typography.
