import Image from 'next/image'
import Link from 'next/link'
import CatalogueEmpty from '@/components/CatalogueEmpty'
import ProductCard from '@/components/ProductCard'
import { catalogue, designs, formatCarat } from '@/lib/catalogue'

/** The heaviest piece in each category makes the strongest tile. Carat, not
 *  price: prices are no longer published, so they are null throughout. */
function categoryHeroes() {
  return catalogue.categories.map((category) => {
    const pieces = designs.filter((d) => d.categorySlug === category.slug)
    const hero = pieces.reduce((best, d) => ((d.carat ?? 0) > (best.carat ?? 0) ? d : best), pieces[0])
    return { category, hero }
  })
}

export default function HomePage() {
  // No source connected, so nothing to show. The full page would render a hero
  // reading "0 designs" over three empty grids, which looks broken rather than
  // deliberate.
  if (!designs.length) return <CatalogueEmpty />

  const heroes = categoryHeroes()
  const opener = heroes[0]?.hero
  const featured = [...designs].sort((a, b) => (b.carat ?? 0) - (a.carat ?? 0)).slice(0, 8)
  const { stats } = catalogue

  return (
    <>
      {/* A buyer who took a card in Sydney lands here first. The delegation is
          the reason they are looking, so it goes above the hero rather than
          inside it — and it is one line, because it is a signpost. */}
      <Link
        href="/oceania"
        className="group block bg-brand text-white transition-opacity hover:opacity-95"
      >
        <div className="shell flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-3.5 text-center">
          <span className="text-[0.6875rem] uppercase tracking-label text-white/80">
            19–26 August
          </span>
          <span className="text-[0.9375rem]">
            Meeting buyers in Melbourne, Sydney, Brisbane &amp; Auckland
          </span>
          <span className="text-[0.6875rem] uppercase tracking-label underline underline-offset-4">
            Details
          </span>
        </div>
      </Link>

      {/* ---------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden border-b border-ink-line">
        <div className="shell grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24">
          <div className="animate-rise">
            <p className="eyebrow">Lab Grown · 14K Gold · E–F · VS–SI</p>

            <h1 className="mt-6 font-display text-[2.75rem] leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Brilliance,
              <br />
              <span className="text-brand">without compromise.</span>
            </h1>

            <p className="mt-7 max-w-lg text-[0.9375rem] leading-relaxed text-bone-dim sm:text-base">
              {stats.designs} designs in 14K gold, set with lab-grown diamonds graded E–F
              colour and VS–SI clarity, made in our own factory in Surat. Every
              specification is published in full — carat weight, stone count, metal weight
              and finish — so a buyer choosing a range has nothing left to ask.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/collection"
                className="bg-gold px-8 py-4 text-[0.6875rem] uppercase tracking-label text-onGold transition-colors hover:bg-gold-soft"
              >
                View the collection
              </Link>
              <Link
                href="/guide"
                className="border border-ink-line px-8 py-4 text-[0.6875rem] uppercase tracking-label text-bone-dim transition-colors hover:border-gold/50 hover:text-gold-soft"
              >
                Understanding diamonds
              </Link>
            </div>

            <dl className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-ink-line pt-8">
              {[
                { value: stats.designs, label: 'Designs' },
                { value: stats.skus, label: 'SKUs' },
                { value: stats.categories, label: 'Categories' },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="font-display text-3xl text-brand sm:text-4xl">{stat.value}</dt>
                  <dd className="eyebrow mt-2">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {opener?.image && (
            <div className="relative animate-rise">
              <div className="well aspect-[4/5]">
                <Image
                  src={opener.image}
                  alt={opener.title}
                  fill
                  priority
                  sizes="(min-width: 1024px) 45vw, 90vw"
                  className="object-contain p-8"
                />
              </div>
              <div className="absolute -bottom-px left-0 max-w-[19rem] border-t border-gold/30 bg-ink/90 p-5 backdrop-blur-sm">
                <p className="eyebrow">{opener.category}</p>
                <p className="mt-2 font-display text-xl leading-snug">{opener.title}</p>
                <p className="mt-1.5 text-sm text-gold-soft">{formatCarat(opener.carat)}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* --------------------------------------------------------- categories */}
      <section className="shell py-20 lg:py-28">
        <div className="max-w-2xl">
          <p className="eyebrow">Browse by category</p>
          <h2 className="rule-gold mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Six collections, one standard
          </h2>
        </div>

        <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {heroes.map(({ category, hero }) => (
            <div key={category.slug}>
            <Link
              href={`/collection?category=${category.slug}`}
              className="group block"
            >
              <div className="well aspect-[4/3]">
                {hero?.thumbnail && (
                  <Image
                    src={hero.thumbnail}
                    alt={category.name}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                    className="object-contain p-8 transition-transform duration-700 ease-out group-hover:scale-[1.07]"
                  />
                )}
              </div>
              <div className="mt-5 flex items-baseline justify-between gap-4 border-b border-ink-line pb-4 transition-colors group-hover:border-gold/40">
                <h3 className="font-display text-2xl transition-colors group-hover:text-gold-soft">
                  {category.name}
                </h3>
                <span className="text-sm text-bone-dim">{category.count}</span>
              </div>
            </Link>

            {/* The shelves, named on the home page rather than discovered
                inside a filter. A customer who came for a tennis bracelet or a
                hip-hop pendant can see it exists and reach it in one click,
                which is the whole reason for having sub-categories at all. */}
            {category.subCategories.length > 1 && (
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                {category.subCategories.map((shelf) => (
                  <li key={shelf.slug}>
                    <Link
                      href={`/collection?category=${category.slug}&type=${shelf.slug}`}
                      className="inline-block py-1 text-[0.8125rem] text-bone-dim underline-offset-4 transition-colors hover:text-gold-soft hover:underline"
                    >
                      {shelf.name}
                      <span className="ml-1 text-xs text-bone-dim/60">{shelf.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------- statement */}
      <section className="border-y border-ink-line bg-ink-soft">
        <div className="shell grid gap-12 py-20 lg:grid-cols-3 lg:py-24">
          {[
            {
              title: 'Identical to mined',
              body: 'Lab-grown diamonds share the exact chemical, physical and optical properties of mined stones. The difference is origin — and price.',
            },
            {
              title: 'Graded E–F, VS–SI',
              body: 'Every stone in this catalogue sits in the colourless band and is eye-clean. No visible tint, no visible inclusions.',
            },
            {
              title: 'Specified in full',
              body: 'Total carat weight, stone count, metal weight and finish are published for every SKU. Nothing is approximate.',
            },
          ].map((item, i) => (
            <div key={item.title}>
              <p className="font-display text-5xl text-brand/30">0{i + 1}</p>
              <h3 className="mt-5 font-display text-2xl">{item.title}</h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-bone-dim">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ featured */}
      <section className="shell py-20 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="eyebrow">Statement pieces</p>
            <h2 className="rule-gold mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              The heaviest carat weights
            </h2>
          </div>
          <Link
            href="/collection"
            className="py-3 text-[0.6875rem] uppercase tracking-label text-gold-soft transition-colors hover:text-gold"
          >
            View all {stats.designs} designs →
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {featured.map((design, i) => (
            <ProductCard key={design.slug} design={design} priority={i < 4} />
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------------- close */}
      <section className="shell pb-24">
        <div className="border border-ink-line px-6 py-16 text-center sm:px-12 lg:py-20">
          <p className="eyebrow">Corporate enquiries</p>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl leading-tight sm:text-4xl">
            Found something for your programme?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-bone-dim">
            This catalogue is a showcase — pieces are not sold online. Note the SKU of
            anything that interests you and get in touch for availability, volume pricing
            and lead times.
          </p>
          <Link
            href="/collection"
            className="mt-9 inline-block bg-gold px-8 py-4 text-[0.6875rem] uppercase tracking-label text-onGold transition-colors hover:bg-gold-soft"
          >
            Start browsing
          </Link>
        </div>
      </section>
    </>
  )
}
