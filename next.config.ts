import type { NextConfig } from 'next';

const securityHeaders = [
  // Prevent browsers from MIME-sniffing the response content type.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Disallow embedding this site in an iframe on a different origin.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Only send the origin (no path/query) in the Referer header.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable browser features the app does not use.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // Enforce HTTPS for 2 years once the browser has seen one secure response.
  // strip-subdomains is omitted intentionally for broad subdomain compatibility.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  // Block IE's built-in XSS filter from silently modifying responses.
  { key: 'X-XSS-Protection', value: '1; mode=block' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'logo.clearbit.com' },
      { protocol: 'https', hostname: 'finnhub.io' },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes.
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;