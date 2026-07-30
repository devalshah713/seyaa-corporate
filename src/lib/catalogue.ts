import data from '../../data/products.json'

export type GalleryImage = { id: string; full: string; thumb: string }

export type Variant = {
  designId: string
  sku: string
  title: string
  metalColour: 'White' | 'Yellow' | 'Rose'
  metal: string
  price: number | null
  carat: number | null
  minCarat: number | null
  diamondCount: number | null
  metalWeight: number | null
  shape: string
  colour: string
  clarity: string
  origin: string
  designType: string
  size: string
  imageId: string
  image: string | null
  thumbnail: string | null
  gallery: GalleryImage[]
}

export type Design = {
  id: string
  slug: string
  title: string
  category: string
  categorySlug: string
  designType: string
  shape: string
  metal: string
  colour: string
  clarity: string
  origin: string
  size: string
  carat: number | null
  minCarat: number | null
  diamondCount: number | null
  metalColours: Variant['metalColour'][]
  priceFrom: number | null
  priceTo: number | null
  caratFrom: number | null
  image: string | null
  thumbnail: string | null
  variants: Variant[]
}

export type Category = { name: string; slug: string; count: number }

export type Catalogue = {
  generatedAt: string
  source: { sheetId: string; title: string }
  stats: {
    designs: number
    skus: number
    categories: number
    priceFrom: number
    priceTo: number
  }
  filters: { shapes: string[]; metalColours: string[]; sizes: string[] }
  categories: Category[]
  designs: Design[]
}

export const catalogue = data as unknown as Catalogue

export const designs = catalogue.designs
export const categories = catalogue.categories

export function getDesign(slug: string): Design | undefined {
  return designs.find((d) => d.slug === slug)
}

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug)
}

/** Whole dollars — the catalogue has no cents worth showing at these values. */
export function formatPrice(value: number | null | undefined): string {
  if (typeof value !== 'number' || !isFinite(value)) return 'On request'
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

/** "From $2,700" when the metal colours are priced differently. */
export function priceRange(design: Design): string {
  const { priceFrom, priceTo } = design
  if (typeof priceFrom !== 'number') return 'Price on request'
  if (typeof priceTo === 'number' && priceTo !== priceFrom) return `From ${formatPrice(priceFrom)}`
  return formatPrice(priceFrom)
}

export function formatCarat(value: number | null | undefined): string {
  if (typeof value !== 'number' || !isFinite(value)) return '—'
  return `${value.toFixed(2).replace(/\.00$/, '')} ct`
}

/**
 * Grading language means nothing to most buyers, so every spec that uses a
 * trade code is paired with the plain-English equivalent shown alongside it.
 */
export const PLAIN_ENGLISH: Record<string, { label: string; meaning: string }> = {
  'E-F': {
    label: 'Colourless',
    meaning:
      'E–F sits in the top colour band. The diamond reads as pure white to the eye, with no warm tint.',
  },
  'VS-SI': {
    label: 'Eye-clean',
    meaning:
      'VS–SI means any natural inclusions need magnification to find. Nothing is visible while it is being worn.',
  },
  'Lab Grown': {
    label: 'Lab grown',
    meaning:
      'Chemically and optically identical to a mined diamond, grown in a controlled environment. Conflict-free and materially better value.',
  },
}

export const METAL_SWATCHES: Record<Variant['metalColour'], string> = {
  White: 'linear-gradient(135deg, #F2F2F0 0%, #C9CACC 55%, #8E9094 100%)',
  Yellow: 'linear-gradient(135deg, #F6E3AE 0%, #D9B45A 55%, #A67C23 100%)',
  Rose: 'linear-gradient(135deg, #F3D2C4 0%, #DDA286 55%, #B87355 100%)',
}
