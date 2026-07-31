/**
 * Where enquiries go. This is the only place these details live — change them
 * here and every button on the site follows.
 *
 * `whatsapp` must be the full international number as digits only: no `+`,
 * spaces, brackets or dashes. A US number reads `15551234567`, an Indian one
 * `919876543210`. Leave it empty and the WhatsApp button hides itself rather
 * than sending anyone to a broken link.
 */
export const CONTACT = {
  whatsapp: '',
  email: 'seyaalabjewel@gmail.com',
  businessName: 'Seyaa Jewels',
} as const

export const hasWhatsApp = () => /^\d{8,15}$/.test(CONTACT.whatsapp)
