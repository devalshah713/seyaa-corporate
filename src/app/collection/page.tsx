import { Suspense } from 'react'
import type { Metadata } from 'next'
import CatalogueEmpty from '@/components/CatalogueEmpty'
import CollectionBrowser from '@/components/CollectionBrowser'
import { catalogue, categories, designs } from '@/lib/catalogue'

export const metadata: Metadata = {
  title: 'The Collection',
  description: `Browse all ${catalogue.stats.designs} lab-grown diamond designs — filter by category, metal and diamond shape.`,
}

export default function CollectionPage() {
  // The browser's own empty state says "no pieces match your filters", which is
  // the wrong explanation when there are no pieces at all.
  if (!designs.length) return <CatalogueEmpty />

  return (
    <Suspense fallback={<div className="shell py-24 text-sm text-bone-dim">Loading the collection…</div>}>
      <CollectionBrowser
        designs={designs}
        categories={categories}
        shapes={catalogue.filters.shapes}
        metalColours={catalogue.filters.metalColours}
      />
    </Suspense>
  )
}
