import { Suspense } from 'react'
import type { Metadata } from 'next'
import CollectionBrowser from '@/components/CollectionBrowser'
import { catalogue, categories, designs } from '@/lib/catalogue'

export const metadata: Metadata = {
  title: 'The Collection',
  description: `Browse all ${catalogue.stats.designs} lab-grown diamond designs — filter by category, metal, diamond shape and price.`,
}

export default function CollectionPage() {
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
