/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: './',
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['framer-motion']
  }
};

export default nextConfig;
