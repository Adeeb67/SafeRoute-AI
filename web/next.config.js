/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Turned off to prevent dual rendering of leaflet map component
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

module.exports = nextConfig;
