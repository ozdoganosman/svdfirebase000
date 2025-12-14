import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    // Production Cloud Function API URL
    // This will be baked into the build and available as process.env.NEXT_PUBLIC_API_URL
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://api-tfi7rlxtca-uc.a.run.app",
    NEXT_PUBLIC_ADMIN_API_URL: process.env.NEXT_PUBLIC_ADMIN_API_URL || "https://api-tfi7rlxtca-uc.a.run.app",
  },
  images: {
    unoptimized: true, // Disable image optimization for Firebase Storage URLs
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5001",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },
  turbopack: {
    root: __dirname,
  },
  // Performance optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports for tree-shaking
    optimizePackageImports: ["firebase", "firebase/app", "firebase/auth", "firebase/firestore", "firebase/storage"],
  },
  // Compression
  compress: true,
  // Power by header removal
  poweredByHeader: false,
  // Generate ETags for caching
  generateEtags: true,
};

export default nextConfig;
