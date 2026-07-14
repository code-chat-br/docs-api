import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: process.env.NEXT_OUTPUT_STANDALONE === '1' ? 'standalone' : undefined,
  poweredByHeader: false,
  async redirects() {
    return [
      { source: '/docs/installation', destination: '/docs/environment', permanent: true },
      { source: '/docs/plans', destination: '/docs/pro-endpoints', permanent: true },
      { source: '/docs/legacy', destination: '/docs/legacy-endpoints', permanent: true },
      { source: '/docs/passkey', destination: '/docs/passkey-pairing', permanent: true },
      { source: '/webhooks', destination: '/docs/webhooks', permanent: false },
      { source: '/webhooks/events', destination: '/docs/webhooks#eventos', permanent: false },
      { source: '/realtime', destination: '/docs/realtime', permanent: false },
      { source: '/realtime/events', destination: '/docs/realtime-events', permanent: false },
      { source: '/websocket', destination: '/realtime', permanent: true },
      { source: '/websocket/events', destination: '/realtime/events', permanent: true },
      { source: '/changelog', destination: '/docs/changelog', permanent: false },
    ];
  },
};

export default withMDX(config);
