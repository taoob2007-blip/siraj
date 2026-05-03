/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
  async redirects() {
    return [
      // Canonical domain enforcement — www → non-www (permanent).
      // This runs before middleware and ensures OAuth cookies are always
      // scoped to usesiraj.com, preventing "invalid flow state" errors.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.usesiraj.com' }],
        destination: 'https://usesiraj.com/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
