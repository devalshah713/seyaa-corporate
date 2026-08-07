import type { Metadata } from 'next'
import Link from 'next/link'
import { catalogue } from '@/lib/catalogue'

export const metadata: Metadata = {
  title: 'Understanding Your Diamond',
  description:
    'What E–F colour, VVS–VS clarity, carat weight and lab-grown origin actually mean — in plain English.',
}

const SECTIONS = [
  {
    eyebrow: 'Origin',
    title: 'What "lab grown" means',
    body: [
      'A lab-grown diamond is a diamond. Not a simulant, not cubic zirconia — the same carbon crystal structure, the same hardness, the same fire and brilliance. A gemmologist needs specialist equipment to tell one from a mined stone.',
      'The only difference is where it formed: in a controlled chamber over weeks rather than underground over millions of years. That means a guaranteed conflict-free origin, and typically far more carat weight for the same budget.',
    ],
  },
  {
    eyebrow: 'Colour · E–F',
    title: 'Why the stones read pure white',
    body: [
      'Diamond colour runs from D (completely colourless) down to Z (noticeably tinted). Every stone in this catalogue is graded E–F, which sits in the colourless band, right at the top of the scale.',
      'In practice: no warm or yellow cast. The diamonds read as bright white against both white and yellow gold.',
    ],
  },
  {
    eyebrow: 'Clarity · VVS–VS',
    title: 'Why you will not see an inclusion',
    body: [
      'Almost every diamond contains tiny natural marks called inclusions. Clarity grades how easy they are to see, from Flawless down to Included.',
      'VVS ("very very slightly included") and VS ("very slightly included") sit near the top of that scale — inclusions take magnification to locate at all. Worn on the wrist, ear or neck, the stone is eye-clean.',
    ],
  },
  {
    eyebrow: 'Carat',
    title: 'Weight, not size',
    body: [
      'A carat is a unit of weight — one fifth of a gram. Where a piece holds many stones, we publish the total diamond weight across all of them, plus the number of stones.',
      'So a bracelet listed at 33.50 ct with 30 diamonds carries roughly 1.1 ct per stone. Both figures are listed on every piece so nothing is ambiguous.',
    ],
  },
  {
    eyebrow: 'Metal',
    title: '14K gold, three finishes',
    body: [
      'Every piece is 14K gold — 58.5% pure gold alloyed for strength, which is the right balance for jewellery worn daily. Softer 18K and 22K scratch and bend more easily.',
      'Most designs are offered in white and yellow gold, some in rose. The metal weight in grams is listed for each SKU, because it varies between finishes.',
    ],
  },
]

export default function GuidePage() {
  return (
    <div className="shell py-14 lg:py-20">
      <div className="max-w-2xl">
        <p className="eyebrow">The guide</p>
        <h1 className="rule-gold mt-4 font-display text-4xl leading-[1.1] tracking-tight sm:text-6xl">
          Understanding
          <br />
          your diamond
        </h1>
        <p className="mt-8 text-[0.9375rem] leading-relaxed text-bone-dim sm:text-base">
          Every listing carries the same grading shorthand the trade uses. Here is what
          each term actually means, without the jargon.
        </p>
      </div>

      <div className="mt-16 space-y-px lg:mt-20">
        {SECTIONS.map((section) => (
          <article
            key={section.title}
            className="grid gap-6 border-t border-ink-line py-10 lg:grid-cols-[16rem_1fr] lg:gap-14 lg:py-14"
          >
            <div>
              <p className="eyebrow">{section.eyebrow}</p>
              <h2 className="mt-3 font-display text-2xl leading-snug lg:text-3xl">{section.title}</h2>
            </div>
            <div className="max-w-2xl space-y-4">
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-[0.9375rem] leading-relaxed text-bone-dim">
                  {paragraph}
                </p>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-16 border border-ink-line px-6 py-14 text-center sm:px-12">
        <h2 className="font-display text-3xl">Ready to look?</h2>
        <p className="mx-auto mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-bone-dim">
          {catalogue.stats.designs} designs across {catalogue.stats.categories} categories,
          each with its full specification listed.
        </p>
        <Link
          href="/collection"
          className="mt-8 inline-block bg-gold px-8 py-4 text-[0.6875rem] uppercase tracking-label text-onGold transition-colors hover:bg-gold-soft"
        >
          Browse the collection
        </Link>
      </div>
    </div>
  )
}
