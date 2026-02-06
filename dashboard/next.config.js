/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/screenshots/:path*',
        destination: '/api/screenshots/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
