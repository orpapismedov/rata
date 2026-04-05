import type { NextConfig } from "next";

// Only apply the /rata subpath when building for GitHub Pages.
// On Netlify (where GITHUB_PAGES is not "true") the site runs at the root.
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: isGitHubPages ? '/rata' : '',
  assetPrefix: isGitHubPages ? '/rata/' : '',
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
