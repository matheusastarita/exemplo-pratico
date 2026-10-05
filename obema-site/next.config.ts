import type { NextConfig } from "next";

// No GitHub Pages o site é publicado como arquivos estáticos dentro de
// /<nome-do-repositório>. O workflow .github/workflows/deploy-pages.yml
// liga este modo com GITHUB_PAGES=true e NEXT_PUBLIC_BASE_PATH.
const isGitHubPages = process.env.GITHUB_PAGES === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
    // Exportação estática não tem servidor para otimizar imagens.
    unoptimized: isGitHubPages,
  },
  ...(isGitHubPages && {
    output: "export",
    basePath,
    trailingSlash: true,
  }),
};

export default nextConfig;
