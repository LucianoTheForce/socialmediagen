/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // External packages for server components
  serverExternalPackages: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  
  // Headers for CORS and security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  
  // Webpack configuration for WASM and WebAssembly
  webpack: (config, { isServer }) => {
    // Support for WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    // Add rule for WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });
    
    // Fallback for Node.js modules in browser
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
  
  // Image domains for external images
  images: {
    domains: [
      'localhost',
      'images.unsplash.com',
      'api.runware.ai',
      'cdn.runware.ai',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.runware.ai',
      },
      {
        protocol: 'https',
        hostname: '**.openai.com',
      },
    ],
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Output configuration for Vercel
  output: 'standalone',
  
  // Transpile packages
  transpilePackages: ['@opencut/ui'],
  
  // Static file serving
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : undefined,
  
  // Redirects
  async redirects() {
    return [];
  },
  
  // Rewrites
  async rewrites() {
    return [];
  },
};

export default nextConfig;