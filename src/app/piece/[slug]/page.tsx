import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PieceDetail from '@/components/PieceDetail'
import ProductCard from '@/components/ProductCard'
import { designs, formatCarat, getDesign, priceRange } from '@/lib/catalogue'

type Params = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return designs.map((d) => ({ slug: d.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const design = getDesign(slug)
  if (!design) return { title: 'Piece not found' }

  const description = `${formatCarat(design.carat)} of lab-grown diamonds in ${design.metal}. ${priceRange(design)}.`
  return {
    title: design.title,
    description,
    openGraph: {
      title: design.title,
      description,
      images: design.image ? [design.image] : undefined,
    },
  }
}

export default async function PiecePage({ params }: Params) {
  const { slug } = await params
  const design = getDesign(slug)
  if (!design) notFound()

  // Nearest in price within the same category reads as a genuine alternative.
  const related = designs
    .filter((d) => d.categorySlug === design.categorySlug && d.slug !== design.slug)
    .sort(
      (a, b) =>
        Math.abs((a.priceFrom ?? 0) - (design.priceFrom ?? 0)) -
        Math.abs((b.priceFrom ?? 0) - (design.priceFrom ?? 0)),
    )
    .slice(0, 4)

  return (
    <div className="shell py-10 lg:py-14">
      <nav aria-label="Breadcrumb" className="mb-10 flex flex-wrap items-center gap-2 text-xs text-bone-dim">
        <Link href="/" className="hover:text-gold-soft">
          Home
        </Link>
        <span aria-hidden>/</span>
        <Link href="/collection" className="hover:text-gold-soft">
          Collection
        </Link>
        <span aria-hidden>/</span>
        <Link href={`/collection?category=${design.categorySlug}`} className="hover:text-gold-soft">
          {design.category}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-bone">{design.title}</span>
      </nav>

      <PieceDetail design={design} />

      {related.length > 0 && (
        <section className="mt-24 border-t border-ink-line pt-14">
          <h2 className="font-serif text-3xl">More in {design.category}</h2>
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {related.map((d) => (
              <ProductCard key={d.slug} design={d} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
