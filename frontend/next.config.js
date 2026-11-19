/** @type {import('next').NextConfig} */
const rawBackend = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const backendUrl = rawBackend.startsWith('http://') || rawBackend.startsWith('https://') 
  ? rawBackend.replace(/\/$/, '') 
  : `http://${rawBackend.replace(/\/$/, '')}`;

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
