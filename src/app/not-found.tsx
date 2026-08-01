import Link from 'next/link'

/**
 * Anyone reaching this was following a link that no longer resolves, so it
 * offers the two ways back into the catalogue rather than only apologising.
 * Links to a renamed piece do not land here — those are redirected to the
 * piece's current address in `piece/[slug]/page.tsx`.
 */
export default function NotFound() {
  return (
    <div className="shell flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">Page not found</p>
      <h1 className="mt-5 max-w-lg font-display text-4xl leading-tight tracking-tight sm:text-5xl">
        This page is no longer here
      </h1>
      <p className="mx-auto mt-6 max-w-md text-[0.9375rem] leading-relaxed text-bone-dim">
        The link may be out of date. Every piece is in the collection — search it
        by name or by SKU and you will find what you were sent.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/collection"
          className="bg-gold px-8 py-4 text-[0.6875rem] uppercase tracking-label text-onGold transition-opacity hover:opacity-90"
        >
          Browse the collection
        </Link>
        <Link
          href="/"
          className="border border-ink-line px-8 py-4 text-[0.6875rem] uppercase tracking-label text-bone-dim transition-colors hover:border-gold/50 hover:text-gold-soft"
        >
          Home
        </Link>
      </div>
    </div>
  )
}
