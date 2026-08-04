/**
 * Where this site lives, as an absolute origin.
 *
 * Next needs one to turn a relative asset path into the absolute URL that
 * Open Graph requires. Without it the default is `http://localhost:3000`, and
 * the social card on every shared link resolved to a machine nobody else can
 * reach — so a link pasted into WhatsApp showed no image at all. That matters
 * here more than it usually would: sending a piece over WhatsApp is how this
 * catalogue is actually used.
 *
 * Overridable from the environment (`NEXT_PUBLIC_SITE_URL`) so a preview
 * deployment or a future domain change needs no commit.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://catalogue.seyaajewels.com'
).replace(/\/+$/, '')

export const siteUrl = (path = '/') => new URL(path, SITE_URL).toString()
