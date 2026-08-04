import Link from 'next/link'
import { CONTACT, hasWhatsApp, whatsappHref } from '@/lib/contact'
import WhatsAppIcon from './WhatsAppIcon'

/**
 * Shown when the catalogue holds no pieces — the state between one source
 * sheet being retired and the next being connected.
 *
 * It exists because the alternative is worse: the home page would render a
 * hero reading "0 designs" above three empty grids, which looks like a broken
 * site rather than a deliberate pause. Saying so plainly, and leaving a way to
 * reach sales, keeps the page honest while there is nothing to show.
 */
export default function CatalogueEmpty() {
  return (
    <div className="shell flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">Lab Grown Diamond Jewellery</p>
      <h1 className="mt-5 max-w-xl font-display text-4xl leading-tight tracking-tight sm:text-5xl">
        Our catalogue is being updated
      </h1>
      <p className="mx-auto mt-6 max-w-md text-[0.9375rem] leading-relaxed text-bone-dim">
        The collection is offline while we prepare the new season&apos;s pieces. It
        will be back here shortly. In the meantime we are happy to answer any
        question about a piece or a SKU you already have.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        {hasWhatsApp() && (
          <a
            href={whatsappHref(`Hello ${CONTACT.businessName}, I have a question about your collection.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 bg-gold px-8 py-4 text-[0.6875rem] uppercase tracking-label text-onGold transition-opacity hover:opacity-90"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Chat on WhatsApp
          </a>
        )}
        <Link
          href="/guide"
          className="border border-ink-line px-8 py-4 text-[0.6875rem] uppercase tracking-label text-bone-dim transition-colors hover:border-gold/50 hover:text-gold-soft"
        >
          Understanding diamonds
        </Link>
      </div>
    </div>
  )
}
