import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Klien service-role, MELEWATI RLS. Hanya boleh dipanggil dari kode server
 * (Server Action / Route Handler), tidak pernah dari komponen browser.
 * Dipakai admin panel dan untuk menyimpan kiriman form Contact Us.
 *
 * Batas waktu hanya untuk query database (bukan unggahan gambar ke Storage),
 * supaya panel menampilkan pesan error alih-alih menggantung saat Supabase mati.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diisi di .env");

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { timeout: 10_000, retry: false },
  });
}
