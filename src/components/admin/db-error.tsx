import { Notice } from "./ui";

/** Ditampilkan bila query admin gagal, supaya pengurus tahu apa yang perlu dicek. */
export function DbError({ error }: { error: unknown }) {
  if (!error) return null;
  const code = typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
  const missingTable = code === "42P01" || code === "PGRST205";

  return (
    <div className="mb-6">
      <Notice tone="error">
        {missingTable
          ? "Tabel database belum ada. Jalankan isi file supabase/schema.sql di Supabase → SQL Editor."
          : "Belum bisa terhubung ke database. Pastikan project Supabase aktif (tidak di-pause) dan kredensial di .env benar."}
      </Notice>
    </div>
  );
}
