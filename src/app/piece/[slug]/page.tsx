import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import PieceDetail from '@/components/PieceDetail'
import ProductCard from '@/components/ProductCard'
import { designs, findByIdentifier, formatCarat, getDesign } from '@/lib/catalogue'
import { siteUrl } from '@/lib/site'

type Params = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return designs.map((d) => ({ slug: d.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const design = getDesign(slug)
  if (!design) return { title: 'Piece not found' }

  const description = `${formatCarat(design.carat)} of lab-grown diamonds in ${design.metal}. Price on request.`
  const url = siteUrl(`/piece/${design.slug}`)
  return {
    title: design.title,
    description,
    // A piece is reachable at several addresses — its current slug, any older
    // title-derived one, and its SKU — all of which redirect here. Naming the
    // current slug as canonical keeps those from being read as duplicates.
    alternates: { canonical: url },
    openGraph: {
      title: design.title,
      description,
      type: 'website',
      url,
      images: design.image ? [design.image] : undefined,
    },
  }
}

export default async function PiecePage({ params }: Params) {
  const { slug } = await params
  const design = getDesign(slug)
  if (!design) {
    // A link built before the piece was retitled. Send it to the current
    // address rather than a 404 — the customer asked for a real product.
    // Deliberately temporary (307): titles are edited in a spreadsheet and can
    // change back, and a 308 would be cached in the browser past that.
    const moved = findByIdentifier(slug)
    if (moved) redirect(`/piece/${moved.slug}`)
    notFound()
  }

  // Same shelf first — a tennis bracelet next to other tennis bracelets is a
  // real alternative; next to an eternity band it is a change of subject.
  const sameShelf = designs.filter(
    (d) => d.subCategorySlug === design.subCategorySlug && d.categorySlug === design.categorySlug && d.slug !== design.slug,
  )
  // Then nearest in carat, which is the closest thing to "similar piece" now
  // that prices are not published.
  const related = (sameShelf.length >= 4 ? sameShelf : designs.filter(
    (d) => d.categorySlug === design.categorySlug && d.slug !== design.slug,
  ))
    .sort(
      (a, b) =>
        Math.abs((a.carat ?? 0) - (design.carat ?? 0)) -
        Math.abs((b.carat ?? 0) - (design.carat ?? 0)),
    )
    .slice(0, 4)

  return (
    <div className="shell py-10 lg:py-14">
      <nav aria-label="Breadcrumb" className="mb-10 flex flex-wrap items-center gap-2 text-xs text-bone-dim">
        <Link href="/" className="inline-block py-3 hover:text-gold-soft">
          Home
        </Link>
        <span aria-hidden>/</span>
        <Link href="/collection" className="inline-block py-3 hover:text-gold-soft">
          Collection
        </Link>
        <span aria-hidden>/</span>
        <Link href={`/collection?category=${design.categorySlug}`} className="inline-block py-3 hover:text-gold-soft">
          {design.category}
        </Link>
        <span aria-hidden>/</span>
        {/* The shelf this piece sits on, and a way back to its neighbours —
            the most useful link on the page for someone still comparing. */}
        <Link
          href={`/collection?category=${design.categorySlug}&type=${design.subCategorySlug}`}
          className="inline-block py-3 hover:text-gold-soft"
        >
          {design.subCategory}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-bone">{design.title}</span>
      </nav>

      <PieceDetail design={design} />

      {related.length > 0 && (
        <section className="mt-24 border-t border-ink-line pt-14">
          <h2 className="font-display text-3xl">
            More {sameShelf.length >= 4 ? design.subCategory.toLowerCase() : ''} in {design.category}
          </h2>
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
