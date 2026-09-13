import { createClient } from "@supabase/supabase-js";

/**
 * Klien Supabase untuk konten publik: anon key, jadi RLS tetap berlaku.
 *
 * Sengaja tanpa cookie/sesi. Situs publik tidak punya login, dan memanggil
 * cookies() membuat halaman dirender dinamis sehingga ISR (`revalidate`) tidak jalan.
 *
 * `timeout` + `retry: false`: bila Supabase mati atau di-pause, query gagal dalam
 * 8 detik dan situs memakai konten cadangan. Retry bawaan (4 percobaan dengan jeda)
 * membuat halaman menunggu hampir 40 detik sebelum menyerah.
 */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { timeout: 8_000, retry: false },
  });
}
