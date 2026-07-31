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

## Deploying

Vercel, connected to this repository. No environment variables and no build
overrides — the stock `next build` is correct, because `data/products.json` is
committed. That is deliberate: a deploy never depends on Google Drive being
reachable, so a Drive outage can delay fresh data but can never break a build.

Freshness is the sync workflow's job, not the build's:

```
sheet edited  ─►  05:00 UTC Action runs  ─►  commits data/  ─►  Vercel redeploys
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
