/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
  // Static export only in production — dev uses on-demand rendering so
  // generateStaticParams misses (e.g. when Supabase is unavailable) don't
  // block page navigation during local development.
  output: isDev ? undefined : "export",
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {}
};

export default nextConfig;
