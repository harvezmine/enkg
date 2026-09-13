import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

/** Gambar yang diunggah lewat admin panel disajikan dari Supabase Storage. */
function supabaseImages(): RemotePattern[] {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return [];
  const url = new URL(raw);
  return [
    {
      protocol: url.protocol === "http:" ? "http" : "https",
      hostname: url.hostname,
      port: url.port,
      pathname: "/storage/v1/object/public/**",
    },
  ];
}

const nextConfig: NextConfig = {
  // Menghasilkan .next/standalone -> jalankan `node server.js` di server sendiri.
  output: "standalone",
  // Kunci akar penelusuran file ke folder proyek ini (ada lockfile lain di $HOME).
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  images: { remotePatterns: supabaseImages() },
};

export default nextConfig;
