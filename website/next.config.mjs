import { createMDX } from 'fumadocs-mdx/next';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  basePath: '/docs',
  assetPrefix: '/docs-static',
  turbopack: {
    root: resolve(__dirname, '..'),
  },
  async redirects() {
    return [
      // Direct hits on the bare docs domain (docs.goappo.io/) land on the
      // localized home instead of a basePath 404. basePath:false targets the
      // true root; without it the source would be scoped under /docs.
      { source: '/', destination: '/docs/it', permanent: false, basePath: false },
      // Locale-less docs root (docs.goappo.io/docs) -> default locale.
      { source: '/', destination: '/it', permanent: false },
    ];
  },
};

const withMDX = createMDX();

export default withMDX(config);
