import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Menghasilkan .next/standalone -> jalankan `node server.js` di server sendiri.
  output: "standalone",
  // Kunci akar penelusuran file ke folder proyek ini (ada lockfile lain di $HOME).
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
};

export default nextConfig;
