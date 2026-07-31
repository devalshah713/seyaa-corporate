import Image from 'next/image'
import Link from 'next/link'
import { formatCarat, priceRange, type Design } from '@/lib/catalogue'
import MetalDots from './MetalDots'

export default function ProductCard({ design, priority = false }: { design: Design; priority?: boolean }) {
  return (
    <Link
      href={`/piece/${design.slug}`}
      className="group flex flex-col focus-visible:ring-offset-4"
      aria-label={`${design.title}, ${priceRange(design)}`}
    >
      <div className="well aspect-square">
        {design.thumbnail ? (
          <Image
            src={design.thumbnail}
            alt={design.title}
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 45vw"
            priority={priority}
            /* contain, never cover — cropping a solitaire out of frame would
               misrepresent the piece. */
            className="object-contain p-4 transition-transform duration-700 ease-out group-hover:scale-[1.06] sm:p-6"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-bone-dim">
            Image coming soon
          </div>
        )}

        <span className="absolute left-0 top-0 bg-ink/70 px-2.5 py-1.5 text-[0.625rem] uppercase tracking-label text-bone-dim backdrop-blur-sm">
          {design.shape}
        </span>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <h3 className="font-display text-lg leading-snug text-bone transition-colors group-hover:text-gold-soft">
          {design.title}
        </h3>

        <p className="mt-1.5 text-[0.8125rem] text-bone-dim">
          {formatCarat(design.carat)} total
          {design.diamondCount ? ` · ${design.diamondCount} diamonds` : ''}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <span className="font-display text-lg text-gold-soft">{priceRange(design)}</span>
          <MetalDots colours={design.metalColours} />
        </div>
      </div>
    </Link>
  )
}
