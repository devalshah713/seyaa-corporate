'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { hasWhatsApp, mailtoHref, whatsappHref } from '@/lib/contact'
import WhatsAppIcon from './WhatsAppIcon'
import { buildEnquiryMessage, enquiryTotal, useEnquiry } from '@/lib/enquiry'
import { formatPrice } from '@/lib/catalogue'

export default function EnquiryList() {
  const { items, ready, remove, clear } = useEnquiry()
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState(false)

  const message = buildEnquiryMessage(items, { name, note })
  const total = enquiryTotal(items)

  const subject = `Enquiry — ${items.length} ${items.length === 1 ? 'piece' : 'pieces'}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked; the message is on screen to copy by hand.
    }
  }

  // Until storage has been read, the server-rendered empty list is what shows.
  if (!ready) {
    return <p className="py-24 text-center text-sm text-bone-dim">Loading your list…</p>
  }

  if (items.length === 0) {
    return (
      <div className="border border-ink-line px-6 py-20 text-center">
        <p className="font-display text-2xl">Your enquiry list is empty</p>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-bone-dim">
          Open any piece and tap <span className="text-bone">Add to enquiry</span> — pick as
          many as you like, then send the whole list in one message.
        </p>
        <Link
          href="/collection"
          className="mt-8 inline-block bg-gold px-8 py-4 text-[0.6875rem] uppercase tracking-label text-onGold transition-colors hover:bg-gold-soft"
        >
          Browse the collection
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
      <div>
        <ul className="divide-y divide-ink-line border-y border-ink-line">
          {items.map((item) => (
            <li key={item.sku} className="flex gap-4 py-5 sm:gap-6">
              <Link href={`/piece/${item.slug}`} className="well aspect-square w-24 shrink-0 sm:w-28">
                {item.thumbnail && (
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    fill
                    sizes="112px"
                    className="object-contain p-2"
                  />
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <p className="eyebrow">{item.category}</p>
                <Link
                  href={`/piece/${item.slug}`}
                  className="mt-1 font-display text-lg leading-snug hover:text-gold-soft"
                >
                  {item.title}
                </Link>
                <p className="mt-1 text-[0.8125rem] text-bone-dim">
                  {item.sku} · {item.metalColour} gold
                  {item.carat ? ` · ${item.carat} ct` : ''}
                  {item.size ? ` · ${item.size}` : ''}
                </p>
                <div className="mt-auto flex items-end justify-between gap-4 pt-3">
                  <span className="font-display text-lg text-gold-soft">
                    {formatPrice(item.price)}
                  </span>
                  <button
                    onClick={() => remove(item.sku)}
                    className="py-2 text-[0.6875rem] uppercase tracking-label text-bone-dim underline-offset-4 hover:text-gold-soft hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-4 pt-5">
          <p className="text-sm text-bone-dim">
            {items.length} {items.length === 1 ? 'piece' : 'pieces'} · indicative total{' '}
            <span className="text-bone">{formatPrice(total)}</span>
          </p>
          <button
            onClick={clear}
            className="py-2 text-[0.6875rem] uppercase tracking-label text-bone-dim hover:text-gold-soft"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- send */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="border border-ink-line p-6">
          <p className="font-display text-xl">Send this to us</p>
          <p className="mt-2 text-sm leading-relaxed text-bone-dim">
            Your list goes across with every SKU, so there is nothing to type out.
          </p>

          <label className="eyebrow mt-6 block" htmlFor="enq-name">
            Your name or company
          </label>
          <input
            id="enq-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Optional"
            className="mt-2 w-full border border-ink-line bg-transparent px-4 py-3 text-base placeholder:text-bone-dim/60 focus:border-gold/60 lg:text-sm"
          />

          <label className="eyebrow mt-4 block" htmlFor="enq-note">
            Anything to add
          </label>
          <textarea
            id="enq-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Quantities, sizes, delivery timing…"
            className="mt-2 w-full resize-y border border-ink-line bg-transparent px-4 py-3 text-base placeholder:text-bone-dim/60 focus:border-gold/60 lg:text-sm"
          />

          <div className="mt-6 space-y-3">
            {hasWhatsApp() && (
              <a
                href={whatsappHref(message)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 bg-[#25D366] py-4 text-[0.6875rem] uppercase tracking-label text-white transition-opacity hover:opacity-90"
              >
                <WhatsAppIcon className="h-[1.125rem] w-[1.125rem]" />
                Send on WhatsApp
              </a>
            )}
            <a
              href={mailtoHref(subject, message)}
              className={`block py-4 text-center text-[0.6875rem] uppercase tracking-label transition-colors ${
                hasWhatsApp()
                  ? 'border border-gold/50 text-gold-soft hover:bg-gold hover:text-onGold'
                  : 'bg-gold text-onGold hover:bg-gold-soft'
              }`}
            >
              Send by email
            </a>
            <button
              onClick={copy}
              className="block w-full py-3 text-center text-[0.6875rem] uppercase tracking-label text-bone-dim hover:text-gold-soft"
            >
              {copied ? 'Copied to clipboard' : 'Copy the list instead'}
            </button>
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer py-2 text-[0.6875rem] uppercase tracking-label text-bone-dim hover:text-gold-soft">
              Preview the message
            </summary>
            <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words border border-ink-line bg-ink-soft p-3 text-xs leading-relaxed text-bone-dim">
              {message}
            </pre>
          </details>
        </div>
      </aside>
    </div>
  )
}
