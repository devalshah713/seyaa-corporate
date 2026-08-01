'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  METAL_SWATCHES,
  PLAIN_ENGLISH,
  formatCarat,
  formatPrice,
  type Design,
} from '@/lib/catalogue'
import { buildEnquiryMessage, useEnquiry } from '@/lib/enquiry'
import { hasWhatsApp, whatsappHref } from '@/lib/contact'
import PieceGallery from './PieceGallery'
import WhatsAppIcon from './WhatsAppIcon'

/**
 * Most shapes read naturally as "oval-cut", but the catalogue also uses "Mix"
 * for multi-shape settings and "Letter M" for initial pendants, neither of
 * which can take the suffix.
 */
function cutPhrase(shape: string) {
  const value = shape.trim()
  if (!value) return 'lab-grown diamonds'
  if (/^mix$/i.test(value)) return 'lab-grown diamonds in mixed shapes'
  if (/^letter\b/i.test(value)) return 'lab-grown diamonds'
  return `${value.toLowerCase()}-cut lab-grown diamonds`
}

export default function PieceDetail({ design }: { design: Design }) {
  const [variantIndex, setVariantIndex] = useState(0)
  const { toggle, has, count, ready } = useEnquiry()

  const variant = design.variants[variantIndex] ?? design.variants[0]
  const inList = has(variant.sku)

  const specs: { label: string; value: string; hint?: string }[] = [
    { label: 'SKU', value: variant.sku },
    { label: 'Metal', value: `${variant.metal} · ${variant.metalColour}` },
    { label: 'Total diamond weight', value: formatCarat(variant.carat) },
    ...(variant.minCarat && variant.minCarat !== variant.carat
      ? [{ label: 'Minimum diamond weight', value: formatCarat(variant.minCarat) }]
      : []),
    { label: 'Number of diamonds', value: variant.diamondCount ? String(variant.diamondCount) : '—' },
    { label: 'Diamond shape', value: variant.shape || '—' },
    {
      label: 'Diamond colour',
      value: variant.colour,
      hint: PLAIN_ENGLISH[variant.colour]?.meaning,
    },
    {
      label: 'Diamond clarity',
      value: variant.clarity,
      hint: PLAIN_ENGLISH[variant.clarity]?.meaning,
    },
    { label: 'Metal weight', value: variant.metalWeight ? `${variant.metalWeight} g` : '—' },
    ...(variant.size ? [{ label: 'Size', value: variant.size }] : []),
    {
      label: 'Diamond origin',
      value: variant.origin,
      hint: PLAIN_ENGLISH[variant.origin]?.meaning,
    },
  ]

  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
      {/* --------------------------------------------------------- imagery */}
      {/* Keyed on the SKU so switching metal colour rewinds the gallery to the
          first shot — of the new colour — instead of holding a scroll offset
          that belonged to the old one. */}
      <PieceGallery
        key={variant.sku}
        images={variant.gallery ?? []}
        title={design.title}
        metalColour={variant.metalColour}
      />

      {/* ----------------------------------------------------------- detail */}
      <div>
        <p className="eyebrow">{design.category}</p>
        <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl">{variant.title}</h1>

        <p className="mt-6 font-display text-3xl text-gold-soft">{formatPrice(variant.price)}</p>

        <p className="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-bone-dim">
          {formatCarat(variant.carat)} of {cutPhrase(variant.shape)}
          {variant.diamondCount ? ` across ${variant.diamondCount} stones` : ''}, set in{' '}
          {variant.metal}
          {variant.size ? ` · ${variant.size}` : ''}.
        </p>

        {/* metal toggle */}
        {design.variants.length > 1 && (
          <div className="mt-9">
            <p className="eyebrow">
              Metal — <span className="text-bone">{variant.metalColour} gold</span>
            </p>
            <div className="mt-3.5 flex flex-wrap gap-3">
              {design.variants.map((v, i) => (
                <button
                  key={v.sku}
                  onClick={() => setVariantIndex(i)}
                  aria-pressed={i === variantIndex}
                  title={`${v.metalColour} gold — ${v.sku}`}
                  className={`flex items-center gap-2.5 border px-4 py-2.5 text-sm transition-colors ${
                    i === variantIndex
                      ? 'border-gold text-bone'
                      : 'border-ink-line text-bone-dim hover:border-gold/40'
                  }`}
                >
                  <span
                    className="h-4 w-4 rounded-full ring-1 ring-inset ring-black/25"
                    style={{ background: METAL_SWATCHES[v.metalColour] ?? '#999' }}
                  />
                  {v.metalColour}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* specification */}
        <div className="mt-11">
          <p className="eyebrow">Specification</p>
          <dl className="mt-4 divide-y divide-ink-line border-y border-ink-line">
            {specs.map((spec) => (
              <div key={spec.label} className="grid grid-cols-[1fr_auto] gap-4 py-3.5">
                <dt className="text-sm text-bone-dim">
                  {spec.label}
                  {spec.hint && (
                    <span
                      title={spec.hint}
                      className="ml-1.5 cursor-help border-b border-dotted border-bone-dim/60 text-[0.6875rem] text-bone-dim/80"
                    >
                      ?
                    </span>
                  )}
                </dt>
                <dd className="text-right text-sm text-bone">
                  {spec.value}
                  {PLAIN_ENGLISH[spec.value] && (
                    <span className="block text-xs text-gold-soft/80">
                      {PLAIN_ENGLISH[spec.value].label}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* enquiry */}
        <div className="mt-10 border border-ink-line p-6">
          <p className="font-display text-xl">Interested in this piece?</p>
          <p className="mt-2.5 text-sm leading-relaxed text-bone-dim">
            This catalogue is a showcase — pieces are not sold online. Add SKU{' '}
            <span className="text-gold-soft">{variant.sku}</span> to your list, keep
            browsing, then send everything you have chosen in one message.
          </p>

          <button
            onClick={() =>
              toggle({
                sku: variant.sku,
                slug: design.slug,
                title: variant.title,
                category: design.category,
                metalColour: variant.metalColour,
                metal: variant.metal,
                price: variant.price,
                carat: variant.carat,
                size: variant.size,
                thumbnail: variant.thumbnail,
              })
            }
            aria-pressed={inList}
            className={`mt-5 w-full py-4 text-[0.6875rem] uppercase tracking-label transition-colors sm:w-auto sm:px-8 ${
              inList
                ? 'border border-gold/50 text-gold-soft hover:bg-gold/10'
                : 'bg-gold text-onGold hover:bg-gold-soft'
            }`}
          >
            {inList ? 'Added — remove from list' : 'Add to enquiry'}
          </button>

          {/* Straight to sales about this one piece, for a buyer who does not
              want to build a list first. */}
          {hasWhatsApp() && (
            <a
              href={whatsappHref(
                buildEnquiryMessage([
                  {
                    sku: variant.sku,
                    slug: design.slug,
                    title: variant.title,
                    category: design.category,
                    metalColour: variant.metalColour,
                    metal: variant.metal,
                    price: variant.price,
                    carat: variant.carat,
                    size: variant.size,
                    thumbnail: variant.thumbnail,
                  },
                ]),
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2.5 bg-[#25D366] py-4 text-[0.6875rem] uppercase tracking-label text-white transition-opacity hover:opacity-90 sm:w-auto sm:px-8"
            >
              <WhatsAppIcon className="h-[1.125rem] w-[1.125rem]" />
              Enquire on WhatsApp
            </a>
          )}

          {ready && count > 0 && (
            <p className="mt-4 text-sm text-bone-dim">
              <Link href="/enquiry" className="text-gold-soft underline underline-offset-4">
                {count} {count === 1 ? 'piece' : 'pieces'} on your list
              </Link>{' '}
              — review and send.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
