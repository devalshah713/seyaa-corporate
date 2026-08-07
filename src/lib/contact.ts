/**
 * Where enquiries go.
 *
 * The WhatsApp number can be set in either of two places, and the environment
 * wins. Setting it in Vercel (Settings → Environment Variables →
 * `NEXT_PUBLIC_WHATSAPP_NUMBER`) means the number can change without a code
 * change or a pull request — useful when sales moves to a different handset.
 * `NEXT_PUBLIC_` is required so the value is inlined into the static build.
 */

/** Whatever a human pastes — "+1 (555) 123-4567" — reduced to wa.me's format. */
function normaliseNumber(input: string | undefined): string {
  const digits = (input ?? '').replace(/\D/g, '')
  // International numbers run 8–15 digits including country code; anything
  // outside that is a typo, and a wrong number is worse than no button.
  return /^\d{8,15}$/.test(digits) ? digits : ''
}

/**
 * Fallback used when no environment variable is set. Full international
 * number including country code — +852 6570 9821, the Hong Kong office.
 */
const WHATSAPP_FALLBACK = '85265709821'

export const CONTACT = {
  whatsapp: normaliseNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || WHATSAPP_FALLBACK),
  email: process.env.NEXT_PUBLIC_SALES_EMAIL || 'seyaadiam@yahoo.com',
  businessName: 'Seyaa Jewels',
} as const

export const hasWhatsApp = () => CONTACT.whatsapp.length > 0

/**
 * A wa.me deep link. Opens the WhatsApp app on a phone and WhatsApp Web on a
 * desktop, landing straight in the chat with the message already typed — the
 * customer only has to press send.
 */
export function whatsappHref(message: string): string {
  return `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(message)}`
}

export function mailtoHref(subject: string, body: string): string {
  return `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
