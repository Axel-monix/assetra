const withNextIntl = require('next-intl/plugin')();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... konfigurasi yang sudah ada
};

module.exports = withNextIntl(nextConfig);