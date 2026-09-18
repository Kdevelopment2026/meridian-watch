import type { NextConfig } from "next";

/*
  The site is entirely static: no server rendering at request time, no
  API routes. Exporting it means it can be dropped onto any host, and
  the same build can be served either at a domain root or from a
  sub-path inside another site.

  SITE_BASE_PATH=/demos/meridian npm run build   -> for the sub-path copy
  npm run build                                  -> for the standalone site
*/
const basePath = process.env.SITE_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  images: {
    // Static export ships the files as authored, so they are compressed
    // at source rather than on demand.
    unoptimized: true,
  },
  transpilePackages: ["three"],
};

export default nextConfig;
