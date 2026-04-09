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
}

module.exports = withPWA(nextConfig)
