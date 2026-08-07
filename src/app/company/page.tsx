import fs from 'node:fs'
import path from 'node:path'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import WhatsAppIcon from '@/components/WhatsAppIcon'
import { catalogue } from '@/lib/catalogue'
import { CONTACT, hasWhatsApp, mailtoHref, whatsappHref } from '@/lib/contact'
import { siteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'The Company',
  description:
    'Seyaa Jewels manufactures 14K gold lab-grown diamond jewellery at its own factory in Surat, with head office in Mumbai and offices in New York, Dubai and Hong Kong.',
  alternates: { canonical: siteUrl('/company') },
  openGraph: {
    title: 'Seyaa Jewels — The Company',
    description:
      'A manufacturer, not an intermediary. 100+ people on one factory floor in Surat, head office in Mumbai, offices in New York, Dubai and Hong Kong.',
    url: siteUrl('/company'),
    images: ['/brand/og.jpg'],
  },
}

/**
 * Where we are. Deliberately city-level: an office is a person a buyer can
 * reach in their own working day, which is the thing that matters to them, and
 * street addresses on a public page invite mail rather than orders.
 *
 * Surat is not in this list. It is the factory, not an office, and it gets a
 * section of its own below — collapsing the two would give away the one thing
 * that separates us from an exporter with a desk.
 */
const OFFICES = [
  { city: 'New York', country: 'United States', role: 'North American accounts' },
  { city: 'Dubai', country: 'United Arab Emirates', role: 'Middle East & Africa' },
  { city: 'Hong Kong', country: 'SAR, China', role: 'East Asia & sourcing' },
  { city: 'Mumbai', country: 'India', role: 'Head office' },
]

const PROOF = [
  {
    figure: '100+',
    label: 'People',
    body: 'Cutters, setters, polishers, QC and design under one roof in Surat — not a network of subcontractors.',
  },
  {
    figure: '4',
    label: 'Offices',
    body: 'New York, Dubai, Hong Kong and Mumbai, so an order is answered inside the buyer’s own working day.',
  },
  {
    figure: `${catalogue.stats.designs}`,
    label: 'Designs in stock',
    body: `${catalogue.stats.skus} SKUs across six categories, each published with its full specification.`,
  },
  {
    figure: 'E–F',
    label: 'Colour, VS–SI clarity',
    body: 'The grade band every piece in the catalogue is held to. Colourless, eye-clean, stated per SKU.',
  },
]

export default function CompanyPage() {
  // The portrait is dropped in as a file rather than committed by the build, so
  // the page has to survive its absence — a monogram is a design decision, a
  // broken image is a mistake a buyer sees.
  const portrait = '/team/shaival-gandhi.jpg'
  const hasPortrait = fs.existsSync(path.join(process.cwd(), 'public', portrait))

  return (
    <>
      {/* ------------------------------------------------------------- opening */}
      <section className="border-b border-ink-line">
        <div className="shell py-16 lg:py-24">
          <p className="eyebrow">The company</p>
          <h1 className="mt-6 max-w-4xl font-display text-[2.5rem] leading-[1.08] tracking-tight sm:text-6xl">
            We do not source these pieces.
            <br />
            <span className="text-brand">We make them.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-bone-dim sm:text-lg">
            Seyaa Jewels is a manufacturer of 14K gold jewellery set with lab-grown
            diamonds, operating our own factory in Surat — the city that cuts and
            polishes the majority of the world&apos;s diamonds. Every piece in this
            catalogue is made by our own people, on our own floor, to a specification
            we publish in full.
          </p>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-bone-dim sm:text-lg">
            That is the whole proposition. A retailer buying from us is buying from
            the bench, not from a layer above it — which is what makes the price,
            the lead time and the answer to &ldquo;can you make this in 200 pieces?&rdquo;
            ours to give rather than ours to ask.
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------------- proof */}
      <section className="border-b border-ink-line bg-ink-soft">
        <div className="shell grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:py-20">
          {PROOF.map((item) => (
            <div key={item.label}>
              <p className="font-display text-5xl leading-none text-brand">{item.figure}</p>
              <p className="eyebrow mt-4">{item.label}</p>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-bone-dim">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- offices */}
      <section className="shell py-16 lg:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow">Where we are</p>
          <h2 className="rule-gold mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Four offices, one factory
          </h2>
          <p className="mt-7 text-[0.9375rem] leading-relaxed text-bone-dim sm:text-base">
            The head office is in Mumbai and the factory is in Surat. The rest exist
            so that a buyer in Auckland or Melbourne is not waiting overnight for a
            reply from a time zone that is asleep.
          </p>
        </div>

        <div className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {OFFICES.map((office) => (
            <div key={office.city} className="border-t border-ink-line pt-5">
              <h3 className="font-display text-2xl">{office.city}</h3>
              <p className="mt-1 text-sm text-bone-dim">{office.country}</p>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-bone-dim">{office.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- manufacture */}
      <section className="border-y border-ink-line bg-ink-soft">
        <div className="shell py-16 lg:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">The factory</p>
            <h2 className="rule-gold mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              Surat, where they are actually made
            </h2>
          </div>

          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="font-display text-2xl">Made, not assembled</h3>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-bone-dim">
                Casting, setting, polishing and quality control happen in-house. Nothing
                is passed to a workshop we do not control, which is why a repeat order
                in six months matches the first one.
              </p>
            </div>
            <div>
              <h3 className="font-display text-2xl">Specified to the stone</h3>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-bone-dim">
                Total carat weight, stone count, individual stone size, metal weight,
                colour, clarity and finish are published for every SKU in this
                catalogue. Nothing is approximate, and nothing has to be chased.
              </p>
            </div>
            <div>
              <h3 className="font-display text-2xl">No minimum, seven days</h3>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-bone-dim">
                One piece is an order — there is no carton to commit to before testing a
                line. Anything in stock in India dispatches in 7 working days, and a
                customised piece in 13.
              </p>
            </div>
            <div>
              <h3 className="font-display text-2xl">Built for a range, not a piece</h3>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-bone-dim">
                {catalogue.stats.designs} designs already exist in {catalogue.stats.skus}{' '}
                SKUs, in white, yellow and rose gold. A buying group fitting a season
                across multiple stores is choosing from stock, not commissioning it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- certified */}
      {/* One laboratory, so this is a statement rather than a grid of cards.
          For a buyer in Australia or New Zealand it is not a badge: lab-grown
          disclosure is a consumer-law obligation on their counter, and a
          certificate is what moves it onto a laboratory's letterhead. */}
      <section className="shell py-16 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:items-start lg:gap-16">
          <p className="font-display text-7xl leading-none text-brand sm:text-8xl">IGI</p>
          <div className="max-w-2xl">
            <p className="eyebrow">Independently graded</p>
            <h2 className="rule-gold mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              Certified by the International Gemological Institute
            </h2>
            <p className="mt-7 text-[0.9375rem] leading-relaxed text-bone-dim sm:text-base">
              Our jewellery is supplied with IGI certification — one of the largest
              independent gemmological laboratories in the world, and the reference
              most retailers already recognise for lab-grown stones.
            </p>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-bone-dim sm:text-base">
              The grade on the certificate is not our word for it. That is the whole
              point of it, and the reason it belongs on the counter with the piece
              rather than in a drawer behind it.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- leadership */}
      <section className="shell py-16 lg:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow">Who you will be dealing with</p>
          <h2 className="rule-gold mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Leadership
          </h2>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[18rem_1fr] lg:gap-16">
          <div className="well aspect-[4/5] max-w-xs">
            {hasPortrait ? (
              <Image
                src={portrait}
                alt="Shaival Gandhi, Chief Executive — Sales"
                fill
                sizes="(min-width: 1024px) 18rem, 60vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="font-display text-6xl text-brand/30">SG</span>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-display text-3xl">Shaival Gandhi</h3>
            <p className="eyebrow mt-3 text-gold-soft">Chief Executive — Sales</p>
            <p className="mt-7 max-w-2xl text-[0.9375rem] leading-relaxed text-bone-dim sm:text-base">
              Shaival leads Seyaa Jewels&apos; sales across every market we serve, and has
              spent more than two decades in the gem and jewellery trade. He works
              directly with retail chains, buying groups and importers — which means a
              question about a specification, a lead time or a volume gets answered by
              the person who can decide it, not relayed.
            </p>
            <p className="mt-5 max-w-2xl text-[0.9375rem] leading-relaxed text-bone-dim sm:text-base">
              He will be representing Seyaa Jewels in person across Melbourne, Sydney,
              Brisbane and Auckland.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              {hasWhatsApp() && (
                <a
                  href={whatsappHref(
                    `Hello ${CONTACT.businessName}, I saw your catalogue and would like to discuss working together.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 bg-gold px-8 py-4 text-[0.6875rem] uppercase tracking-label text-onGold transition-opacity hover:opacity-90"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Message us
                </a>
              )}
              <a
                href={mailtoHref(
                  'Enquiry from the Seyaa Jewels catalogue',
                  'Hello Seyaa Jewels,\n\nI would like to discuss the following:\n\n',
                )}
                className="border border-ink-line px-8 py-4 text-[0.6875rem] uppercase tracking-label text-bone-dim transition-colors hover:border-gold/50 hover:text-gold-soft"
              >
                Email us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- closing */}
      <section className="border-t border-ink-line bg-ink-soft">
        <div className="shell py-16 text-center lg:py-20">
          <h2 className="mx-auto max-w-2xl font-display text-3xl leading-tight tracking-tight sm:text-4xl">
            The catalogue is open. Every specification is on it.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-bone-dim">
            Browse {catalogue.stats.designs} designs, note the SKUs that fit your floor,
            and send them to us in one message.
          </p>
          <Link
            href="/collection"
            className="mt-9 inline-block bg-gold px-9 py-4 text-[0.6875rem] uppercase tracking-label text-onGold transition-opacity hover:opacity-90"
          >
            View the collection
          </Link>
        </div>
      </section>
    </>
  )
}
