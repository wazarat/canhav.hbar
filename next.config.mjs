/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: [
      "@hashgraph/sdk",
      "hedera-agent-kit",
      "@hashgraph/hedera-agent-kit",
      "@hashgraph/hedera-agent-kit-ai-sdk",
      "@hiero-ledger/sdk",
      "hak-hbar-policies",
    ],
  },
};

export default nextConfig;
