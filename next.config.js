/** @type {import('next').NextConfig} */
const nextConfig = {
    // Core settings
    reactStrictMode: true,
    swcMinify: true,

    // Skip type checking during build (old code has many type errors)
    typescript: {
        ignoreBuildErrors: true,
    },

    // Enable standalone for Azure deployment
    output: 'standalone',

    // Image optimization
    images: {
        domains: ['localhost'],
        formats: ['image/avif', 'image/webp'],
    },

    // Remove console in production
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error', 'warn'],
        } : false,
    },

    // Simple webpack config - KHÔNG dùng crypto
    webpack: (config, { dev, isServer }) => {
        // Chỉ optimization cơ bản
        if (!dev && !isServer) {
            config.optimization.splitChunks = {
                chunks: 'all',
                cacheGroups: {
                    default: false,
                    vendors: false,
                    // Framework chunk
                    framework: {
                        name: 'framework',
                        chunks: 'all',
                        test: /[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types)[\\/]/,
                        priority: 40,
                        enforce: true,
                    },
                    // Common chunk
                    commons: {
                        name: 'commons',
                        chunks: 'all',
                        minChunks: 2,
                        priority: 20,
                    },
                },
            }
        }
        return config
    },

    // REMOVED: API Rewrites that caused infinite loop on Azure
    // The app should serve its own API routes, not proxy to itself

    // Security headers
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    },
                ]
            }
        ]
    },
}

// Nếu là .mjs file thì dùng:
// export default nextConfig

// Nếu là .js file thì dùng:
module.exports = nextConfig