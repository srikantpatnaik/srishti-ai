const withPWA = require('next-pwa')({
   dest: 'public',
   disable: process.env.NODE_ENV === 'development',
   register: true,
   skipWaiting: true,
   runtimeCaching: [
     {
       urlPattern: /^https:\/\/api\.openai\.com\/.*/i,
       handler: 'NetworkFirst',
       options: {
         cacheName: 'openai-cache',
         expiration: {
           maxEntries: 10,
           maxAgeSeconds: 60 * 60 * 24,
         },
         networkTimeoutSeconds: 10,
       },
     },
     {
       urlPattern: /^https:\/\/.*\.(?:json|js|css)$/i,
       handler: 'StaleWhileRevalidate',
       options: {
         cacheName: 'static-resources',
       },
     },
   ],
 })

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: http: https:;",
              "font-src 'self' data:",
              "connect-src 'self' http: https: blob:",
              "media-src 'self' data: blob:",
              "object-src 'none'",
              "frame-src 'self' blob: data:",
              "frame-ancestors 'none'",
              "base-src 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ]
  },
}

module.exports = withPWA(nextConfig)
