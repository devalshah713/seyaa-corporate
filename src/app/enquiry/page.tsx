import type { Metadata } from 'next'
import EnquiryList from '@/components/EnquiryList'

export const metadata: Metadata = {
  title: 'Your Enquiry List',
  description: 'The pieces you have selected, ready to send to our sales team in one message.',
  robots: { index: false }, // a personal, device-local list — nothing to index
}

export default function EnquiryPage() {
  return (
    <div className="shell py-12 lg:py-16">
      <div className="max-w-2xl">
        <p className="eyebrow">Enquiry</p>
        <h1 className="rule-gold mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          Your selection
        </h1>
        <p className="mt-8 text-[0.9375rem] leading-relaxed text-bone-dim">
          Pieces are not sold online. Send us the list and we will come back with
          availability, volume pricing and lead times.
        </p>
      </div>

      <div className="mt-12">
        <EnquiryList />
      </div>
    </div>
  )
}
