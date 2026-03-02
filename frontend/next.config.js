/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.exercism.org',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/exercism-heatmap.svg',
        destination: '/api/exercism-heatmap-svg',
      },
      {
        source: '/api/exercism-heatmap-sample.svg',
        destination: '/api/exercism-heatmap-sample-svg',
      },
      {
        source: '/api/exercism-monthly-heatmap.svg',
        destination: '/api/exercism-monthly-heatmap-svg',
      },
    ];
  },
};

module.exports = nextConfig;
