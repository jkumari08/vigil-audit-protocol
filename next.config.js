/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    AGENT_PRIVATE_KEY: process.env.AGENT_PRIVATE_KEY || "",
    ADI_RPC: "https://rpc.ab.testnet.adifoundation.ai",
    ADI_CHAIN_ID: "99999",
    BASE_RPC: "https://mainnet.base.org",
    KITE_RPC: "https://rpc-testnet.gokite.ai",
    NEXT_PUBLIC_ADI_RPC: "https://rpc.ab.testnet.adifoundation.ai",
    NEXT_PUBLIC_ADI_CHAIN_ID: "99999",
    NEXT_PUBLIC_BASE_CHAIN_ID: "8453",
    NEXT_PUBLIC_KITE_CHAIN_ID: "2368",
  },
};

module.exports = nextConfig;
