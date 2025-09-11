import path from 'path';
import type { NextConfig } from 'next';
import createMDX from '@next/mdx';

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    // remarkPlugins: [],
    // rehypePlugins: [],
  },
});

const baseConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // MDX pages
  pageExtensions: ['ts', 'tsx', 'mdx'],

  webpack(config) {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
};

export default withMDX(baseConfig);
