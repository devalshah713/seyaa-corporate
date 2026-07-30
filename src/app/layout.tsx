import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import { catalogue } from '@/lib/catalogue'

export const metadata: Metadata = {
  title: {
    default: 'Seyaa — Lab Grown Diamond Jewellery',
    template: '%s · Seyaa',
  },
  description:
    'A curated showcase of 14K gold lab-grown diamond jewellery for corporate partners — bracelets, rings, necklaces, pendants and earrings with full specifications.',
  openGraph: {
    title: 'Seyaa — Lab Grown Diamond Jewellery',
    description:
      'A curated showcase of 14K gold lab-grown diamond jewellery for corporate partners.',
    type: 'website',
  },
}

const NAV = [
  { href: '/collection', label: 'Collection' },
  { href: '/collection?category=bracelets', label: 'Bracelets' },
  { href: '/collection?category=rings', label: 'Rings' },
  { href: '/collection?category=necklaces', label: 'Necklaces' },
  { href: '/guide', label: 'Diamond Guide' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b border-ink-line bg-ink/85 backdrop-blur-md">
          <div className="shell flex h-16 items-center justify-between gap-6 sm:h-20">
            <Link href="/" className="group flex flex-col leading-none">
              <span className="font-serif text-2xl tracking-wide text-bone transition-colors group-hover:text-gold-soft sm:text-[1.75rem]">
                SEYAA
              </span>
              <span className="eyebrow mt-1 hidden text-[0.5625rem] sm:block">
                Lab Grown Diamonds
              </span>
            </Link>

            <nav className="hidden items-center gap-8 lg:flex">
              {NAV.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-[0.8125rem] tracking-wide text-bone-dim transition-colors hover:text-gold-soft"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link
              href="/collection"
              className="border border-gold/50 px-4 py-2.5 text-[0.6875rem] uppercase tracking-label text-gold-soft transition-colors hover:border-gold hover:bg-gold hover:text-onGold sm:px-6"
            >
              Browse
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-24 border-t border-ink-line">
          <div className="shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="font-serif text-2xl tracking-wide">SEYAA</p>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-bone-dim">
                14K gold jewellery set with lab-grown diamonds, made for corporate
                partners and their clients.
              </p>
            </div>

            <div>
              <p className="eyebrow">Collection</p>
              <ul className="mt-4 space-y-2.5">
                {catalogue.categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/collection?category=${c.slug}`}
                      className="text-sm text-bone-dim transition-colors hover:text-gold-soft"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="eyebrow">Information</p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link href="/guide" className="text-sm text-bone-dim transition-colors hover:text-gold-soft">
                    Understanding your diamond
                  </Link>
                </li>
                <li>
                  <Link href="/collection" className="text-sm text-bone-dim transition-colors hover:text-gold-soft">
                    Full catalogue
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="eyebrow">Enquiries</p>
              <p className="mt-4 text-sm leading-relaxed text-bone-dim">
                This is a showcase catalogue. Pieces are not sold online — contact us
                with a SKU for availability and corporate pricing.
              </p>
            </div>
          </div>

          <div className="border-t border-ink-line">
            <div className="shell flex flex-col gap-2 py-6 text-xs text-bone-dim sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} Seyaa. All rights reserved.</p>
              <p>
                {catalogue.stats.designs} designs · {catalogue.stats.skus} SKUs · updated{' '}
                {new Date(catalogue.generatedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
