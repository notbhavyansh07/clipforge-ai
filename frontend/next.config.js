/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_INTERNAL_URL 
  ? (process.env.BACKEND_INTERNAL_URL.startsWith('http') ? process.env.BACKEND_INTERNAL_URL : `http://${process.env.BACKEND_INTERNAL_URL}`)
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig

