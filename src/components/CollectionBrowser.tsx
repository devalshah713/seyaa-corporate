'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import ProductCard from './ProductCard'
import { formatPrice, type Category, type Design } from '@/lib/catalogue'

// No price sort and no price filter: prices are not published, so both would
// rank or narrow on a value the browser does not have — and a working price
// band is itself a way to read a price off a catalogue that hides them.
type Sort = 'featured' | 'carat-desc' | 'carat-asc'

const SORTS: { value: Sort; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'carat-desc', label: 'Carat: high to low' },
  { value: 'carat-asc', label: 'Carat: low to high' },
]

type Props = {
  designs: Design[]
  categories: Category[]
  shapes: string[]
  metalColours: string[]
}

export default function CollectionBrowser({ designs, categories, shapes, metalColours }: Props) {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [category, setCategory] = useState<string>(params.get('category') ?? 'all')
  const [type, setType] = useState<string>(params.get('type') ?? 'all')
  const [shape, setShape] = useState<string>(params.get('shape') ?? 'all')
  const [setting, setSetting] = useState<string>(params.get('setting') ?? 'all')
  const [metal, setMetal] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('featured')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = designs.filter((d) => {
      if (category !== 'all' && d.categorySlug !== category) return false
      if (type !== 'all' && d.subCategorySlug !== type) return false
      if (shape !== 'all' && d.shape !== shape) return false
      if (setting !== 'all' && d.setting !== setting) return false
      if (metal !== 'all' && !d.metalColours.includes(metal as Design['metalColours'][number])) return false

      if (needle) {
        // Buyers search by SKU as often as by name.
        const haystack = [d.title, d.shape, d.category, d.subCategory, ...d.variants.map((v) => v.sku)]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(needle)) return false
      }
      return true
    })

    const sorted = [...filtered]
    if (sort === 'carat-desc') sorted.sort((a, b) => (b.carat ?? 0) - (a.carat ?? 0))
    if (sort === 'carat-asc') sorted.sort((a, b) => (a.carat ?? 0) - (b.carat ?? 0))
    return sorted
  }, [designs, category, type, shape, setting, metal, query, sort])

  const activeCount =
    (category !== 'all' ? 1 : 0) +
    (type !== 'all' ? 1 : 0) +
    (shape !== 'all' ? 1 : 0) +
    (setting !== 'all' ? 1 : 0) +
    (metal !== 'all' ? 1 : 0)

  const openCategory = categories.find((c) => c.slug === category)
  const shelves = openCategory?.subCategories ?? []
  const openShelf = shelves.find((s) => s.slug === type)

  /**
   * The third level: which diamond shapes exist inside the shelf currently
   * open, with a live count each.
   *
   * Derived from the pieces on the shelf rather than from the catalogue-wide
   * list, and rendered only when there is a genuine choice. Half the shelves
   * hold a single shape — every stud is round — and offering one option, or
   * an option that returns nothing, is worse than offering none. Tennis
   * bracelets span seven shapes, which is exactly where it earns its place.
   */
  const [shapesHere, settingsHere] = useMemo(() => {
    /**
     * Options for one refinement, counted against everything *except* itself.
     *
     * Excluding the facet from its own pool is what keeps its other options
     * visible once one is chosen — count "Oval" against the oval-only pool and
     * every other shape reads zero and looks unavailable. Counting each facet
     * against the *other* one is what stops dead options appearing: pick Bezel
     * and only the shapes that come in bezel are offered.
     */
    const options = (facet: 'shape' | 'setting') => {
      const counts = new Map<string, number>()
      for (const d of designs) {
        if (category !== 'all' && d.categorySlug !== category) continue
        if (type !== 'all' && d.subCategorySlug !== type) continue
        if (facet !== 'shape' && shape !== 'all' && d.shape !== shape) continue
        if (facet !== 'setting' && setting !== 'all' && d.setting !== setting) continue
        const value = facet === 'shape' ? d.shape : d.setting
        if (value) counts.set(value, (counts.get(value) ?? 0) + 1)
      }
      return [...counts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    }
    return [options('shape'), options('setting')] as const
  }, [designs, category, type, shape, setting])

  /**
   * Category and sub-category live in the address bar, so a refined view can be
   * sent to someone — "here are the tennis bracelets" is a link, not a set of
   * instructions.
   *
   * Driven from the handlers rather than an effect on the state. An effect also
   * fires on mount, and during a client-side transition it can run while
   * `usePathname()` still reports the page being navigated *away from* — which
   * rewrote a freshly-opened `/collection?category=…` straight back to `/` and
   * bounced the customer home. Only a real interaction should touch the URL.
   *
   * `replace` rather than `push` keeps Back going to wherever the customer came
   * from instead of walking them back through every filter they tried.
   */
  const syncUrl = (nextCategory: string, nextType: string, nextShape: string, nextSetting: string) => {
    const next = new URLSearchParams()
    if (nextCategory !== 'all') next.set('category', nextCategory)
    if (nextType !== 'all') next.set('type', nextType)
    if (nextShape !== 'all') next.set('shape', nextShape)
    if (nextSetting !== 'all') next.set('setting', nextSetting)
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  /** Picking a new category drops a shelf that does not exist inside it. */
  const chooseCategory = (slug: string) => {
    setCategory(slug)
    setType('all')
    setShape('all')
    setSetting('all')
    syncUrl(slug, 'all', 'all', 'all')
  }

  /**
   * Moving shelf keeps the chosen shape only if the new shelf actually has it.
   * Carrying "Emerald" from tennis bracelets into a shelf of round-only studs
   * would land the customer on an empty grid they did not ask for.
   */
  const chooseType = (slug: string) => {
    const onNewShelf = designs.filter(
      (d) =>
        (category === 'all' || d.categorySlug === category) &&
        (slug === 'all' || d.subCategorySlug === slug),
    )
    const keep = (value: string, read: (d: Design) => string | null) =>
      value !== 'all' && onNewShelf.some((d) => read(d) === value) ? value : 'all'

    const nextShape = keep(shape, (d) => d.shape)
    const nextSetting = keep(setting, (d) => d.setting)
    setType(slug)
    setShape(nextShape)
    setSetting(nextSetting)
    syncUrl(category, slug, nextShape, nextSetting)
  }

  const chooseShape = (next: string) => {
    setShape(next)
    syncUrl(category, type, next, setting)
  }

  const chooseSetting = (next: string) => {
    setSetting(next)
    syncUrl(category, type, shape, next)
  }

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
    setType('all')
    setShape('all')
    setMetal('all')
    setSetting('all')
    setQuery('')
    syncUrl('all', 'all', 'all', 'all')
  }

  return (
    <div className="shell py-12 lg:py-16">
      <div className="max-w-2xl">
        <p className="eyebrow">
          {openCategory ? (
            <button onClick={() => chooseCategory('all')} className="hover:text-gold-soft">
              The collection
            </button>
          ) : (
            'The collection'
          )}
          {openCategory && <span aria-hidden> / {openCategory.name}</span>}
        </p>
        <h1 className="rule-gold mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          {[
            shape !== 'all' ? shapeLabel(shape) : '',
            setting !== 'all' ? setting : '',
            openShelf?.name ?? '',
            openCategory?.name ?? (shape !== 'all' || setting !== 'all' ? 'pieces' : 'Every piece'),
          ]
            .filter(Boolean)
            .join(' ')}
        </h1>
      </div>

      {/* The shelves inside the open category, always visible rather than
          buried in the filter panel. This is the whole point of the hierarchy:
          a customer who wants a tennis bracelet should reach it in two taps,
          not by opening a filter sheet and hunting. It scrolls sideways on a
          phone so a long row never wraps into a wall of chips. */}
      {shelves.length > 1 && (
        <div className="mt-8 -mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2.5">
            <Chip active={type === 'all'} onClick={() => chooseType('all')}>
              All {openCategory?.name.toLowerCase()}
              <ChipCount>{openCategory?.count}</ChipCount>
            </Chip>
            {shelves.map((shelf) => (
              <Chip key={shelf.slug} active={type === shelf.slug} onClick={() => chooseType(shelf.slug)}>
                {shelf.name}
                <ChipCount>{shelf.count}</ChipCount>
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* Third level. Deliberately quieter than the shelf row above it — these
          refine a shelf rather than choosing one, and rows of equal weight
          would read as one confusing block of buttons. Each appears only where
          it offers a real choice. */}
      <Refinement label="Diamond shape" options={shapesHere} value={shape} onChange={chooseShape} format={shapeLabel} />
      <Refinement label="Setting" options={settingsHere} value={setting} onChange={chooseSetting} />

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
            <FilterOption active={category === 'all'} onClick={() => chooseCategory('all')}>
              All categories
            </FilterOption>
            {categories.map((c) => (
              <li key={c.slug}>
                <FilterOption
                  active={category === c.slug}
                  onClick={() => chooseCategory(c.slug)}
                  count={c.count}
                  bare
                >
                  {c.name}
                </FilterOption>

                {/* Sub-categories nest under their parent, and only the open
                    one expands — showing all six categories' shelves at once
                    would be a list of twenty-odd options to read past. */}
                {category === c.slug && c.subCategories.length > 1 && (
                  <ul className="mb-1 ml-3 border-l border-ink-line pl-3">
                    <FilterOption active={type === 'all'} onClick={() => chooseType('all')}>
                      Everything
                    </FilterOption>
                    {c.subCategories.map((shelf) => (
                      <FilterOption
                        key={shelf.slug}
                        active={type === shelf.slug}
                        onClick={() => chooseType(shelf.slug)}
                        count={shelf.count}
                      >
                        {shelf.name}
                      </FilterOption>
                    ))}
                  </ul>
                )}
              </li>
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
            <FilterOption active={shape === 'all'} onClick={() => chooseShape('all')}>
              Any shape
            </FilterOption>
            {shapes.map((s) => (
              <FilterOption key={s} active={shape === s} onClick={() => chooseShape(s)}>
                {s}
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
                Try clearing a filter, or search by name or SKU to find a specific
                piece.
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

/**
 * `bare` renders without the wrapping <li>, for the category rows that own a
 * nested <ul> of sub-categories and so supply their own list item.
 */
function FilterOption({
  active,
  onClick,
  count,
  bare,
  children,
}: {
  active: boolean
  onClick: () => void
  count?: number
  bare?: boolean
  children: React.ReactNode
}) {
  const button = (
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
  )
  return bare ? button : <li>{button}</li>
}

/** A shelf button in the row above the grid. */
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex shrink-0 items-center gap-2 whitespace-nowrap border px-4 py-2.5 text-[0.6875rem] uppercase tracking-label transition-colors ${
        active
          ? 'border-gold bg-gold text-onGold'
          : 'border-ink-line text-bone-dim hover:border-gold/50 hover:text-gold-soft'
      }`}
    >
      {children}
    </button>
  )
}

const ChipCount = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[0.625rem] opacity-60">{children}</span>
)

/** "Mix" is the sheet's word for a multi-shape setting; it needs saying properly. */
function shapeLabel(shape: string) {
  return shape === 'Mix' ? 'Mixed' : shape
}

/**
 * One refinement row. Renders nothing unless there is a genuine choice —
 * a single option is not a choice, and none at all is not a row.
 *
 * "Any" is always offered, and matters more than it looks: eleven of the forty
 * tennis bracelets do not state a setting in their title, so they are reachable
 * under Any and nowhere else. Showing customers a "Not specified" bucket would
 * put a gap in the source data on the shop floor; the sync reports those pieces
 * by name instead, for the team to fix at the sheet.
 */
function Refinement({
  label,
  options,
  value,
  onChange,
  format = (v: string) => v,
}: {
  label: string
  options: { name: string; count: number }[]
  value: string
  onChange: (next: string) => void
  format?: (value: string) => string
}) {
  if (options.length < 2) return null
  return (
    <div className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-2">
      <span className="eyebrow text-bone-dim/70">{label}</span>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <ShapeLink active={value === 'all'} onClick={() => onChange('all')}>
          Any
        </ShapeLink>
        {options.map((option) => (
          <ShapeLink
            key={option.name}
            active={value === option.name}
            onClick={() => onChange(option.name)}
          >
            {format(option.name)}
            <span className="ml-1 text-xs text-bone-dim/60">{option.count}</span>
          </ShapeLink>
        ))}
      </div>
    </div>
  )
}

/** A third-level refinement — lighter than a Chip, heavier than body text. */
function ShapeLink({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`py-1.5 text-[0.8125rem] underline-offset-4 transition-colors ${
        active ? 'text-gold-soft underline' : 'text-bone-dim hover:text-bone'
      }`}
    >
      {children}
    </button>
  )
}

export { formatPrice }
