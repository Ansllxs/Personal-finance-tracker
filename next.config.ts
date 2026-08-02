import type { NextConfig } from "next";

const isElectron = process.env.ELECTRON === "1";

const nextConfig: NextConfig = {
  // Empaquetado desktop (Electron): servidor Node mínimo
  output: "standalone",
  // Evita choque con `npm run dev` del navegador
  distDir: isElectron ? ".next-electron" : ".next",
};

export default nextConfig;
