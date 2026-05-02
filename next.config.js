/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  serverExternalPackages: ['@react-pdf/renderer'],
}

module.exports = nextConfig
