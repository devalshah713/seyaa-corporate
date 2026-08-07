import type { Metadata } from 'next'
import Link from 'next/link'
import WhatsAppIcon from '@/components/WhatsAppIcon'
import { catalogue } from '@/lib/catalogue'
import { CONTACT, hasWhatsApp, mailtoHref, whatsappHref } from '@/lib/contact'
import { siteUrl } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Australia & New Zealand',
  description:
    'Seyaa Jewels is meeting retailers, buying groups and importers in Melbourne, Sydney, Brisbane and Auckland, 19–26 August, with the GJEPC Jewellery Trade Delegation.',
  alternates: { canonical: siteUrl('/oceania') },
  openGraph: {
    title: 'Seyaa Jewels in Australia & New Zealand — 19–26 August',
    description:
      'Melbourne, Sydney, Brisbane and Auckland. 14K gold lab-grown diamond jewellery, made in our own factory.',
    url: siteUrl('/oceania'),
    images: ['/brand/og.jpg'],
  },
}

/**
 * The delegation itinerary, from the GJEPC circular.
 *
 * Each city carries its own opening line for the WhatsApp deep link, because a
 * buyer in Brisbane pressing "request a meeting" should not then have to type
 * which city they are in — the message that opens already says it.
 */
const ITINERARY = [
  { city: 'Melbourne', country: 'Australia', dates: '19–20 August', note: 'Opening two days of the delegation.' },
  {
    city: 'Sydney',
    country: 'Australia',
    dates: '21–22 August',
    note: 'Coinciding with the International Jewellery Fair.',
  },
  { city: 'Brisbane', country: 'Australia', dates: '23–24 August', note: 'Queensland retail and wholesale.' },
  { city: 'Auckland', country: 'New Zealand', dates: '25–26 August', note: 'Closing two days, New Zealand.' },
]

/**
 * The four categories the delegation circular names, answered from stock.
 * Counts are read from the catalogue so this cannot drift from the sheet.
 */
function offering() {
  const designs = catalogue.designs
  const inCategory = (...slugs: string[]) =>
    designs.filter((d) => slugs.includes(d.categorySlug)).length

  return [
    {
      title: 'Lab-grown diamond jewellery',
      count: designs.length,
      body: 'Every piece in our catalogue. E–F colour, VS–SI clarity, stated as lab grown on each SKU — the disclosure Australian and New Zealand consumer law expects, published rather than promised.',
      href: '/collection',
    },
    {
      title: 'Studded jewellery',
      count: inCategory('bracelets', 'necklaces', 'rings'),
      body: 'Tennis bracelets and necklaces, eternity bands, solitaires and halos — the lines that carry a counter.',
      href: '/collection?category=bracelets&type=tennis',
    },
    {
      title: 'Fine jewellery',
      count: inCategory('pendants', 'stud-earrings', 'hoop-earrings'),
      body: 'Studs in basket and martini settings, hoops, drops, solitaire pendants and a character range that moves at a different price point.',
      href: '/collection?category=stud-earrings',
    },
    {
      title: 'Gold',
      count: catalogue.stats.skus,
      body: '14K throughout, in white, yellow and rose — every design available in more than one colour, so a range fits a floor rather than a single case.',
      href: '/collection',
    },
  ]
}

export default function OceaniaPage() {
  const categories = offering()

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="border-b border-ink-line">
        <div className="shell py-16 lg:py-24">
          <p className="eyebrow text-gold-soft">GJEPC Jewellery Trade Delegation · 19–26 August</p>
          <h1 className="mt-6 max-w-4xl font-display text-[2.5rem] leading-[1.08] tracking-tight sm:text-6xl">
            We are bringing the factory
            <br />
            <span className="text-brand">to Australia and New Zealand.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-bone-dim sm:text-lg">
            Seyaa Jewels joins the Gem &amp; Jewellery Export Promotion Council&apos;s trade
            delegation to Oceania, meeting retailers, buying groups, importers and
            wholesalers across four cities in eight days.
          </p>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-bone-dim sm:text-lg">
            We are a manufacturer, not an agent. The person you meet can quote a
            specification, a lead time and a repeat order without going back to ask
            anyone.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            {hasWhatsApp() && (
              <a
                href={whatsappHref(
                  `Hello ${CONTACT.businessName}, I would like to arrange a meeting during your Australia and New Zealand visit in August.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-gold px-8 py-4 text-[0.6875rem] uppercase tracking-label text-onGold transition-opacity hover:opacity-90"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Request a meeting
              </a>
            )}
            <Link
              href="/collection"
              className="border border-ink-line px-8 py-4 text-[0.6875rem] uppercase tracking-label text-bone-dim transition-colors hover:border-gold/50 hover:text-gold-soft"
            >
              See the {catalogue.stats.designs} designs
            </Link>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- itinerary */}
      <section className="border-b border-ink-line bg-ink-soft">
        <div className="shell py-16 lg:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">Where to find us</p>
            <h2 className="rule-gold mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              Four cities, eight days
            </h2>
          </div>

          <ol className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {ITINERARY.map((stop) => (
              <li key={stop.city} className="border-t border-ink-line pt-5">
                <p className="eyebrow text-gold-soft">{stop.dates}</p>
                <h3 className="mt-3 font-display text-2xl">{stop.city}</h3>
                <p className="mt-1 text-sm text-bone-dim">{stop.country}</p>
                <p className="mt-4 text-[0.9375rem] leading-relaxed text-bone-dim">{stop.note}</p>
                {hasWhatsApp() && (
                  <a
                    href={whatsappHref(
                      `Hello ${CONTACT.businessName}, I am based in ${stop.city} and would like to meet during your visit on ${stop.dates}.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-block py-2 text-[0.6875rem] uppercase tracking-label text-gold-soft underline-offset-4 hover:underline"
                  >
                    Meet us in {stop.city}
                  </a>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------ offering */}
      <section className="shell py-16 lg:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow">What we are bringing</p>
          <h2 className="rule-gold mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Answered from stock, not from a sample book
          </h2>
          <p className="mt-7 text-[0.9375rem] leading-relaxed text-bone-dim sm:text-base">
            The delegation names the categories Oceania is buying. These are ours, and
            they already exist — {catalogue.stats.designs} designs in {catalogue.stats.skus}{' '}
            SKUs, each published with its full specification.
          </p>
        </div>

        <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2">
          {categories.map((item) => (
            <Link key={item.title} href={item.href} className="group border-t border-ink-line pt-6">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-2xl transition-colors group-hover:text-gold-soft">
                  {item.title}
                </h3>
                <span className="font-display text-3xl text-brand">{item.count}</span>
              </div>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-bone-dim">{item.body}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- why India */}
      <section className="border-y border-ink-line bg-ink-soft">
        <div className="shell py-16 lg:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">For an Oceania buyer</p>
            <h2 className="rule-gold mt-4 font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              Three things worth knowing
            </h2>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-3">
            <div>
              <p className="font-display text-5xl leading-none text-brand/30">01</p>
              <h3 className="mt-5 font-display text-2xl">Your morning, not ours</h3>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-bone-dim">
                Offices in New York, Dubai, Hong Kong and India mean a question sent from
                Auckland at nine is answered inside your working day, not overnight from a
                single time zone.
              </p>
            </div>
            <div>
              <p className="font-display text-5xl leading-none text-brand/30">02</p>
              <h3 className="mt-5 font-display text-2xl">A repeat that matches</h3>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-bone-dim">
                Casting, setting, polishing and QC are all in our own Surat factory, run by
                a team of over 100. Nothing is passed to a workshop we do not control,
                which is why the second order looks like the first.
              </p>
            </div>
            <div>
              <p className="font-display text-5xl leading-none text-brand/30">03</p>
              <h3 className="mt-5 font-display text-2xl">Disclosed, on every SKU</h3>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-bone-dim">
                Origin, colour, clarity, carat weight and stone count are published for
                every piece, in plain English alongside the trade grading. A retailer
                passing that to a customer is passing on something already written down.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- closing */}
      <section className="shell py-16 text-center lg:py-24">
        <h2 className="mx-auto max-w-3xl font-display text-3xl leading-tight tracking-tight sm:text-4xl">
          Come to the meeting with the SKUs already chosen.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[0.9375rem] leading-relaxed text-bone-dim">
          Browse the catalogue, add the pieces that fit your floor, and send the whole
          list in one message. We will bring them.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/collection"
            className="bg-gold px-9 py-4 text-[0.6875rem] uppercase tracking-label text-onGold transition-opacity hover:opacity-90"
          >
            Browse the collection
          </Link>
          <a
            href={mailtoHref(
              'Meeting request — Australia & New Zealand, August',
              'Hello Seyaa Jewels,\n\nWe would like to meet during your Oceania visit.\n\nCompany:\nCity:\nPreferred date:\n\n',
            )}
            className="border border-ink-line px-9 py-4 text-[0.6875rem] uppercase tracking-label text-bone-dim transition-colors hover:border-gold/50 hover:text-gold-soft"
          >
            Email us
          </a>
        </div>
      </section>
    </>
  )
}
