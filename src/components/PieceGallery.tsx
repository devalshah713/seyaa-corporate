'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { GalleryImage } from '@/lib/catalogue'

/**
 * The photography for one SKU, swipeable when there is more than one shot.
 *
 * Movement is native scroll-snap rather than a JavaScript gesture handler.
 * That buys the platform's own momentum, rubber-banding and pointer
 * cancellation for free, and — the part a hand-rolled swipe usually gets
 * wrong — a drag that starts out vertical still scrolls the page instead of
 * being swallowed by the carousel.
 *
 * Remount this component when the metal colour changes (`key={variant.sku}`)
 * so both the index and the scroll position reset to the first shot.
 */
export default function PieceGallery({
  images,
  title,
  metalColour,
}: {
  images: GalleryImage[]
  title: string
  metalColour: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const many = images.length > 1

  /** Which slide is under the viewport, derived from scroll rather than stored. */
  const syncIndex = useCallback(() => {
    const track = trackRef.current
    if (!track || !track.clientWidth) return
    const at = Math.round(track.scrollLeft / track.clientWidth)
    setIndex(Math.min(Math.max(at, 0), images.length - 1))
  }, [images.length])

  useEffect(() => {
    const track = trackRef.current
    if (!track || !many) return

    // Scroll fires far more often than paint; coalesce to one read per frame.
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        syncIndex()
      })
    }

    track.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      track.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [many, syncIndex])

  /** Scroll — never assign state directly, or the dots lie about the position. */
  const goTo = (to: number) => {
    const track = trackRef.current
    if (!track) return
    const clamped = Math.min(Math.max(to, 0), images.length - 1)
    // No `behavior` given, so the CSS wins — which the reduced-motion block in
    // globals.css forces back to an instant jump.
    track.scrollTo({ left: clamped * track.clientWidth })
  }

  if (!images.length) {
    return (
      <div className="well flex aspect-square items-center justify-center text-sm text-bone-dim">
        Photography coming soon
      </div>
    )
  }

  return (
    <div>
      <div className="group relative">
        <div
          ref={trackRef}
          className="well swipe-track aspect-square"
          tabIndex={many ? 0 : -1}
          role={many ? 'group' : undefined}
          aria-label={many ? `${title} — ${images.length} photographs, swipe or use the arrow keys` : undefined}
          onKeyDown={(event) => {
            if (!many) return
            if (event.key === 'ArrowRight') {
              event.preventDefault()
              goTo(index + 1)
            } else if (event.key === 'ArrowLeft') {
              event.preventDefault()
              goTo(index - 1)
            }
          }}
        >
          {images.map((image, i) => (
            <div key={image.id} className="relative aspect-square w-full shrink-0 snap-center">
              <Image
                src={image.full}
                alt={
                  i === 0
                    ? `${title} in ${metalColour} gold`
                    : `${title} in ${metalColour} gold, view ${i + 1}`
                }
                fill
                priority={i === 0}
                // The next shot is one flick away, and a clipped slide never
                // trips the lazy-loading observer — so it would arrive blank.
                loading={i < 2 ? 'eager' : 'lazy'}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-contain p-6 sm:p-10"
              />
            </div>
          ))}
        </div>

        {many && (
          <>
            {/* Touch has the swipe; these are for the mouse, which has no
                horizontal gesture on an ordinary wheel. */}
            <Arrow side="left" onClick={() => goTo(index - 1)} disabled={index === 0} />
            <Arrow side="right" onClick={() => goTo(index + 1)} disabled={index === images.length - 1} />

            {/* Tells a phone there is a second photograph before it is swiped. */}
            <p
              aria-hidden
              className="pointer-events-none absolute bottom-3 right-3 bg-ink/75 px-2.5 py-1 text-[0.6875rem] tabular-nums tracking-wide text-bone-dim backdrop-blur-sm sm:hidden"
            >
              {index + 1} / {images.length}
            </p>
          </>
        )}
      </div>

      {many && (
        <div className="mt-4 flex gap-3">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`View photograph ${i + 1}`}
              aria-current={i === index}
              className={`relative aspect-square w-20 overflow-hidden bg-ink-soft transition-colors ${
                i === index ? 'ring-1 ring-gold' : 'ring-1 ring-ink-line hover:ring-gold/40'
              }`}
            >
              <Image src={image.thumb} alt="" fill sizes="80px" className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Arrow({
  side,
  onClick,
  disabled,
}: {
  side: 'left' | 'right'
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === 'left' ? 'Previous photograph' : 'Next photograph'}
      className={`absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center bg-ink/80 text-bone ring-1 ring-ink-line backdrop-blur-sm transition hover:text-gold-soft disabled:invisible sm:flex ${
        side === 'left' ? 'left-3' : 'right-3'
      }`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path
          d={side === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
