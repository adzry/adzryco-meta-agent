/** @type {import('next').NextConfig} */
const nextConfig = {
  // API calls are routed via NEXT_PUBLIC_API_URL in frontend/lib/config.ts.
  // No Next.js rewrites are used — they would hardcode a backend URL and
  // bypass the env-driven routing that getApiUrl() provides.
};
module.exports = nextConfig;
