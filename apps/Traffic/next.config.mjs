import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
  // Static export only in production — dev uses on-demand rendering so
  // generateStaticParams misses (e.g. when Supabase is unavailable) don't
  // block page navigation during local development.
  output: isDev ? undefined : "export",
  poweredByHeader: false,
  reactStrictMode: true,
  // Pin the workspace root to the monorepo root (apps/Traffic/../../). Without
  // this, Next infers the root from the nearest lockfile and can pick the home
  // directory, which breaks dev-time module tracing/resolution for dependencies
  // hoisted to the repo-root node_modules (e.g. react-globe.gl, three).
  outputFileTracingRoot: join(__dirname, "..", ".."),
  experimental: {}
};

export default nextConfig;
