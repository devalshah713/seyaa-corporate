'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ProductCard from './ProductCard'
import { formatPrice, type Category, type Design } from '@/lib/catalogue'

type Sort = 'featured' | 'price-asc' | 'price-desc' | 'carat-desc'

const SORTS: { value: Sort; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'carat-desc', label: 'Carat: high to low' },
]

/** Round bands are friendlier than a slider and survive new price points. */
const PRICE_BANDS = [
  { label: 'Under $1,000', min: 0, max: 1000 },
  { label: '$1,000 – $2,500', min: 1000, max: 2500 },
  { label: '$2,500 – $5,000', min: 2500, max: 5000 },
  { label: '$5,000 – $10,000', min: 5000, max: 10000 },
  { label: 'Over $10,000', min: 10000, max: Infinity },
]

type Props = {
  designs: Design[]
  categories: Category[]
  shapes: string[]
  metalColours: string[]
}

export default function CollectionBrowser({ designs, categories, shapes, metalColours }: Props) {
  const params = useSearchParams()
  const [category, setCategory] = useState<string>(params.get('category') ?? 'all')
  const [shape, setShape] = useState<string>('all')
  const [metal, setMetal] = useState<string>('all')
  const [band, setBand] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('featured')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const range = band === null ? null : PRICE_BANDS[band]

    const filtered = designs.filter((d) => {
      if (category !== 'all' && d.categorySlug !== category) return false
      if (shape !== 'all' && d.shape !== shape) return false
      if (metal !== 'all' && !d.metalColours.includes(metal as Design['metalColours'][number])) return false

      if (range) {
        const price = d.priceFrom ?? 0
        if (price < range.min || price >= range.max) return false
      }

      if (needle) {
        // Buyers search by SKU as often as by name.
        const haystack = [d.title, d.shape, d.category, ...d.variants.map((v) => v.sku)]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      return true
    })

    const sorted = [...filtered]
    if (sort === 'price-asc') sorted.sort((a, b) => (a.priceFrom ?? 0) - (b.priceFrom ?? 0))
    if (sort === 'price-desc') sorted.sort((a, b) => (b.priceFrom ?? 0) - (a.priceFrom ?? 0))
    if (sort === 'carat-desc') sorted.sort((a, b) => (b.carat ?? 0) - (a.carat ?? 0))
    return sorted
  }, [designs, category, shape, metal, band, query, sort])

  const activeCount =
    (category !== 'all' ? 1 : 0) +
    (shape !== 'all' ? 1 : 0) +
    (metal !== 'all' ? 1 : 0) +
    (band !== null ? 1 : 0)

  // The sheet covers the grid on mobile; let it scroll, not the page behind it.
  useEffect(() => {
    if (!filtersOpen) return
    const isSheet = window.matchMedia('(max-width: 1023px)').matches
    if (!isSheet) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [filtersOpen])

  const reset = () => {
    setCategory('all')
    setShape('all')
    setMetal('all')
    setBand(null)
    setQuery('')
  }

  return (
    <div className="shell py-12 lg:py-16">
      <div className="max-w-2xl">
        <p className="eyebrow">The collection</p>
        <h1 className="rule-gold mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          {category === 'all'
            ? 'Every piece'
            : categories.find((c) => c.slug === category)?.name ?? 'Every piece'}
        </h1>
      </div>

      <div className="mt-10 flex flex-col gap-3 border-y border-ink-line py-4 lg:flex-row lg:items-center lg:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or SKU"
          aria-label="Search by name or SKU"
          className="w-full border border-ink-line bg-transparent px-4 py-3 text-base placeholder:text-bone-dim/60 focus:border-gold/60 lg:max-w-sm lg:text-sm"
        />

        <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap lg:justify-end lg:gap-4">
          <button
            onClick={() => setFiltersOpen(true)}
            className="flex-1 border border-ink-line px-4 py-3 text-[0.6875rem] uppercase tracking-label text-bone-dim transition-colors hover:border-gold/50 hover:text-gold-soft lg:hidden"
          >
            Filters{activeCount ? ` (${activeCount})` : ''}
          </button>

          <span className="order-first w-full text-sm text-bone-dim lg:order-none lg:w-auto">
            {results.length} {results.length === 1 ? 'design' : 'designs'}
          </span>

          <label className="sr-only" htmlFor="sort">
            Sort
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="flex-1 border border-ink-line bg-ink px-3 py-3 text-sm text-bone focus:border-gold/60 lg:flex-none lg:py-2.5"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[15rem_1fr] lg:gap-14">
        {/* Below `lg` the filters are a sheet over the grid rather than a block
            above it — expanding four filter groups inline pushed every product
            off the screen. */}
        {filtersOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 lg:hidden"
            onClick={() => setFiltersOpen(false)}
            aria-hidden
          />
        )}
        <aside
          className={`${
            filtersOpen
              ? 'fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto overscroll-contain border-t border-ink-line bg-ink px-5 pb-28 pt-5 shadow-2xl'
              : 'hidden'
          } lg:static lg:z-auto lg:block lg:max-h-none lg:overflow-visible lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
          role={filtersOpen ? 'dialog' : undefined}
          aria-label={filtersOpen ? 'Filters' : undefined}
        >
          <div className="flex items-center justify-between">
            <p className="eyebrow">Refine</p>
            {activeCount > 0 && (
              <button
                onClick={reset}
                className="py-2 text-[0.6875rem] uppercase tracking-label text-gold-soft hover:text-gold"
              >
                Clear
              </button>
            )}
          </div>

          <FilterGroup label="Category">
            <FilterOption active={category === 'all'} onClick={() => setCategory('all')}>
              All categories
            </FilterOption>
            {categories.map((c) => (
              <FilterOption
                key={c.slug}
                active={category === c.slug}
                onClick={() => setCategory(c.slug)}
                count={c.count}
              >
                {c.name}
              </FilterOption>
            ))}
          </FilterGroup>

          <FilterGroup label="Metal">
            <FilterOption active={metal === 'all'} onClick={() => setMetal('all')}>
              Any metal
            </FilterOption>
            {metalColours.map((m) => (
              <FilterOption key={m} active={metal === m} onClick={() => setMetal(m)}>
                {m} gold
              </FilterOption>
            ))}
          </FilterGroup>

          <FilterGroup label="Diamond shape">
            <FilterOption active={shape === 'all'} onClick={() => setShape('all')}>
              Any shape
            </FilterOption>
            {shapes.map((s) => (
              <FilterOption key={s} active={shape === s} onClick={() => setShape(s)}>
                {s}
              </FilterOption>
            ))}
          </FilterGroup>

          <FilterGroup label="Price">
            <FilterOption active={band === null} onClick={() => setBand(null)}>
              Any price
            </FilterOption>
            {PRICE_BANDS.map((b, i) => (
              <FilterOption key={b.label} active={band === i} onClick={() => setBand(i)}>
                {b.label}
              </FilterOption>
            ))}
          </FilterGroup>

          {/* Pinned inside the sheet so the result count is always in view and
              dismissing never means scrolling back up. */}
          {filtersOpen && (
            <div className="fixed inset-x-0 bottom-0 border-t border-ink-line bg-ink p-4 lg:hidden">
              <button
                onClick={() => setFiltersOpen(false)}
                className="w-full bg-gold py-4 text-[0.6875rem] uppercase tracking-label text-onGold"
              >
                Show {results.length} {results.length === 1 ? 'design' : 'designs'}
              </button>
            </div>
          )}
        </aside>

        <div>
          {results.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 xl:grid-cols-3">
              {results.map((design, i) => (
                <ProductCard key={design.slug} design={design} priority={i < 6} />
              ))}
            </div>
          ) : (
            <div className="border border-ink-line px-6 py-24 text-center">
              <p className="font-display text-2xl">Nothing matches those filters</p>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-bone-dim">
                Try widening the price range or clearing a filter to see more of the
                collection.
              </p>
              <button
                onClick={reset}
                className="mt-8 border border-gold/50 px-6 py-3 text-[0.6875rem] uppercase tracking-label text-gold-soft transition-colors hover:bg-gold hover:text-onGold"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-8 border-t border-ink-line pt-6 first-of-type:mt-6">
      <p className="eyebrow">{label}</p>
      <ul className="mt-3.5 space-y-0.5">{children}</ul>
    </div>
  )
}

function FilterOption({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean
  onClick: () => void
  count?: number
  children: React.ReactNode
}) {
  return (
    <li>
      <button
        onClick={onClick}
        aria-pressed={active}
        className={`flex w-full items-baseline justify-between gap-3 py-2.5 text-left text-sm transition-colors ${
          active ? 'text-gold-soft' : 'text-bone-dim hover:text-bone'
        }`}
      >
        <span className={active ? 'border-b border-gold/60' : ''}>{children}</span>
        {typeof count === 'number' && <span className="text-xs text-bone-dim/70">{count}</span>}
      </button>
    </li>
  )
}

export { PRICE_BANDS, formatPrice }
