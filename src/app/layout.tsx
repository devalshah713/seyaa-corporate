import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import './globals.css'
import { catalogue } from '@/lib/catalogue'

export const metadata: Metadata = {
  title: {
    default: 'Seyaa Jewels — Lab Grown Diamond Jewellery',
    template: '%s · Seyaa Jewels',
  },
  description:
    'A curated showcase of 14K gold lab-grown diamond jewellery for corporate partners — bracelets, rings, necklaces, pendants and earrings with full specifications.',
  openGraph: {
    title: 'Seyaa Jewels — Lab Grown Diamond Jewellery',
    description:
      'A curated showcase of 14K gold lab-grown diamond jewellery for corporate partners.',
    type: 'website',
    images: ['/brand/og.jpg'],
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
            <Link
              href="/"
              aria-label="Seyaa Jewels — home"
              className="group flex items-center gap-3 transition-opacity hover:opacity-80"
            >
              <Image
                src="/brand/mark.webp"
                alt=""
                width={176}
                height={240}
                priority
                className="h-9 w-auto sm:h-11"
              />
              <span className="flex flex-col leading-none">
                <Image
                  src="/brand/wordmark.webp"
                  alt="Seyaa Jewels"
                  width={480}
                  height={97}
                  priority
                  className="h-5 w-auto sm:h-6"
                />
                <span className="eyebrow mt-1.5 hidden text-[0.5625rem] sm:block">
                  Lab Grown Diamonds
                </span>
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

        {/* The brand's own lockup is white on orange, so the footer closes the
            page the same way — and it is the one place a full orange field
            cannot fight the product photography. */}
        <footer className="mt-24 bg-brand text-white">
          <div className="shell grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              {/* The artwork is a single flat colour, so brightness(0) invert(1)
                  renders the same file in white — no second asset to keep in
                  step with the first. */}
              <Image
                src="/brand/mark.webp"
                alt=""
                width={176}
                height={240}
                className="h-16 w-auto [filter:brightness(0)_invert(1)]"
              />
              <Image
                src="/brand/wordmark.webp"
                alt="Seyaa Jewels"
                width={480}
                height={97}
                className="mt-4 h-7 w-auto [filter:brightness(0)_invert(1)]"
              />
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/80">
                14K gold jewellery set with lab-grown diamonds, made for corporate
                partners and their clients.
              </p>
            </div>

            <div>
              <p className="eyebrow text-white/70">Collection</p>
              <ul className="mt-4 space-y-2.5">
                {catalogue.categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/collection?category=${c.slug}`}
                      className="text-sm text-white/85 transition-colors hover:text-white"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="eyebrow text-white/70">Information</p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link href="/guide" className="text-sm text-white/85 transition-colors hover:text-white">
                    Understanding your diamond
                  </Link>
                </li>
                <li>
                  <Link href="/collection" className="text-sm text-white/85 transition-colors hover:text-white">
                    Full catalogue
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="eyebrow text-white/70">Enquiries</p>
              <p className="mt-4 text-sm leading-relaxed text-white/80">
                This is a showcase catalogue. Pieces are not sold online — contact us
                with a SKU for availability and corporate pricing.
              </p>
            </div>
          </div>

          <div className="border-t border-white/25">
            <div className="shell flex flex-col gap-2 py-6 text-xs text-white/75 sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} Seyaa Jewels. All rights reserved.</p>
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
