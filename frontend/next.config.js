const withNextIntl = require('next-intl/plugin')();

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/upload-proxy',
        destination: 'https://43.106.115.184.nip.io/9/upload',
      },
    ];
  },
  images: {
    domains: ['43.106.115.184.nip.io', 'abbastesting.rf.gd'],
  },
};

module.exports = withNextIntl(nextConfig);