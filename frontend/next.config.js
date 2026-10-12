/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // If explicit external backend URL is provided (e.g. Render/Railway/Cloudflare)
    if (process.env.BACKEND_INTERNAL_URL) {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.BACKEND_INTERNAL_URL}/api/:path*`,
        },
      ];
    }
    // In local development with Python backend active
    if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
      return [
        {
          source: '/api/:path*',
          destination: 'http://127.0.0.1:8000/api/:path*',
        },
      ];
    }
    // On Vercel / Production without external backend: use native Next.js API routes
    return [];
  },
};

module.exports = nextConfig;
