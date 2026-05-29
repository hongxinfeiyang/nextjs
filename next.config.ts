import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['react-markdown', 'remark-gfm', 'rehype-raw', 'rehype-highlight'],
};

export default nextConfig;
