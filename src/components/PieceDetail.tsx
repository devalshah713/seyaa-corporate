'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  METAL_SWATCHES,
  PLAIN_ENGLISH,
  formatCarat,
  formatPrice,
  type Design,
} from '@/lib/catalogue'

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
  const [imageIndex, setImageIndex] = useState(0)

  const variant = design.variants[variantIndex] ?? design.variants[0]
  const gallery = variant.gallery?.length ? variant.gallery : []
  const active = gallery[imageIndex] ?? gallery[0]

  const selectVariant = (index: number) => {
    setVariantIndex(index)
    setImageIndex(0)
  }

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
      <div>
        <div className="well aspect-square">
          {active ? (
            <Image
              key={active.id}
              src={active.full}
              alt={`${design.title} in ${variant.metalColour} gold`}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="animate-rise object-contain p-6 sm:p-10"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-bone-dim">
              Photography coming soon
            </div>
          )}
        </div>

        {gallery.length > 1 && (
          <div className="mt-4 flex gap-3">
            {gallery.map((image, i) => (
              <button
                key={image.id}
                onClick={() => setImageIndex(i)}
                aria-label={`View image ${i + 1}`}
                aria-pressed={i === imageIndex}
                className={`relative aspect-square w-20 overflow-hidden bg-ink-soft transition-colors ${
                  i === imageIndex ? 'ring-1 ring-gold' : 'ring-1 ring-ink-line hover:ring-gold/40'
                }`}
              >
                <Image src={image.thumb} alt="" fill sizes="80px" className="object-contain p-1.5" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------- detail */}
      <div>
        <p className="eyebrow">{design.category}</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">{variant.title}</h1>

        <p className="mt-6 font-serif text-3xl text-gold-soft">{formatPrice(variant.price)}</p>

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
                  onClick={() => selectVariant(i)}
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
          <p className="font-serif text-xl">Interested in this piece?</p>
          <p className="mt-2.5 text-sm leading-relaxed text-bone-dim">
            This catalogue is a showcase — pieces are not sold online. Quote SKU{' '}
            <span className="text-gold-soft">{variant.sku}</span> when enquiring about
            availability, volume pricing or lead times.
          </p>
          <button
            onClick={() => navigator.clipboard?.writeText(variant.sku)}
            className="mt-5 border border-gold/50 px-6 py-3 text-[0.6875rem] uppercase tracking-label text-gold-soft transition-colors hover:bg-gold hover:text-onGold"
          >
            Copy SKU
          </button>
        </div>
      </div>
    </div>
  )
}
