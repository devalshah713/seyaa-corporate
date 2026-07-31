'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Category } from '@/lib/catalogue'
import { useEnquiry } from '@/lib/enquiry'

const LINKS = [
  { href: '/collection', label: 'Collection' },
  { href: '/guide', label: 'Diamond Guide' },
]

/**
 * The desktop nav collapses below `lg`, so on a phone every link except
 * "Browse" would otherwise be unreachable — this carries the same navigation
 * into a full-height panel.
 */
export default function SiteHeader({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false)
  const { count, ready } = useEnquiry()

  // Stop the page behind the panel from scrolling while it is open.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  // Escape closes it, matching what a dialog is expected to do.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => setOpen(false)

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-ink-line bg-ink/95 backdrop-blur-md">
      <div className="shell flex h-16 items-center justify-between gap-4 sm:h-20">
        <Link
          href="/"
          onClick={close}
          aria-label="Seyaa Jewels — home"
          className="group flex items-center gap-2.5 py-2 transition-opacity hover:opacity-80 sm:gap-3"
        >
          <Image
            src="/brand/mark.webp"
            alt=""
            width={117}
            height={160}
            priority
            className="h-9 w-auto sm:h-11"
          />
          <span className="flex flex-col leading-none">
            <span className="font-script text-[1.625rem] leading-none text-brand sm:text-[2.125rem]">
              Seyaa Jewels
            </span>
            <span className="eyebrow mt-1 hidden text-[0.5rem] sm:block">
              Lab Grown Diamond Jewellery
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="py-2 text-[0.8125rem] tracking-wide text-bone-dim transition-colors hover:text-gold-soft"
            >
              {item.label}
            </Link>
          ))}
          {categories.slice(0, 3).map((c) => (
            <Link
              key={c.slug}
              href={`/collection?category=${c.slug}`}
              className="py-2 text-[0.8125rem] tracking-wide text-bone-dim transition-colors hover:text-gold-soft"
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Only rendered once storage has been read, so the server and first
              client paint agree. */}
          {ready && count > 0 && (
            <Link
              href="/enquiry"
              onClick={close}
              aria-label={`Enquiry list, ${count} ${count === 1 ? 'piece' : 'pieces'}`}
              className="flex items-center gap-2 bg-gold px-4 py-3 text-[0.6875rem] uppercase tracking-label text-onGold transition-colors hover:bg-gold-soft"
            >
              <span className="hidden sm:inline">Enquiry</span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-onGold/25 px-1.5 text-[0.6875rem] leading-none">
                {count}
              </span>
            </Link>
          )}

          <Link
            href="/collection"
            onClick={close}
            className="hidden border border-gold/50 px-5 py-3 text-[0.6875rem] uppercase tracking-label text-gold-soft transition-colors hover:border-gold hover:bg-gold hover:text-onGold sm:inline-block"
          >
            Browse
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="-mr-2 flex h-12 w-12 items-center justify-center text-bone lg:hidden"
          >
            {open ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            )}
          </button>
        </div>
      </div>

      </header>

      {/* Rendered as a sibling of <header>, not inside it: the header's
          backdrop-blur makes it a containing block for fixed descendants, which
          would size this panel against the 64px bar instead of the viewport. */}
      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-16 z-30 overflow-y-auto overscroll-contain bg-ink lg:hidden"
        >
          <nav className="shell py-6">
            {LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={close}
                className="block border-b border-ink-line py-4 font-display text-xl text-bone"
              >
                {item.label}
              </Link>
            ))}

            <p className="eyebrow mt-8">Shop by category</p>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/collection?category=${c.slug}`}
                onClick={close}
                className="flex items-baseline justify-between gap-4 border-b border-ink-line py-4 text-bone"
              >
                <span className="font-display text-lg">{c.name}</span>
                <span className="text-sm text-bone-dim">{c.count}</span>
              </Link>
            ))}

            {ready && count > 0 && (
              <Link
                href="/enquiry"
                onClick={close}
                className="mt-8 flex items-center justify-between border border-gold/50 px-5 py-4 text-[0.6875rem] uppercase tracking-label text-gold-soft"
              >
                <span>Your enquiry list</span>
                <span>{count}</span>
              </Link>
            )}

            <Link
              href="/collection"
              onClick={close}
              className="mt-4 block bg-gold py-4 text-center text-[0.6875rem] uppercase tracking-label text-onGold"
            >
              Browse everything
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}
