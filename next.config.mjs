/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Product photography is served straight from the Drive folder the team
    // already uses, so adding a photo there is all it takes for it to appear.
    // Next resizes, converts to WebP/AVIF and caches, so visitors never wait
    // on Drive for a 1.3 MB PNG.
    remotePatterns: [{ protocol: 'https', hostname: 'drive.google.com' }],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
}

export default nextConfig
