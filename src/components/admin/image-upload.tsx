"use client";

import { useState } from "react";

import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

import { Input } from "./ui";

const MAX_MB = 5;

/**
 * Unggah gambar ke Supabase Storage (bucket "enkg-media") dan simpan URL
 * publiknya ke field tersembunyi. Tetap bisa diisi manual dengan URL gambar.
 */
export function ImageUpload({
  name,
  defaultValue,
  label = "Gambar sampul",
}: {
  name: string;
  defaultValue?: string | null;
  label?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) return setError("File harus berupa gambar.");
    if (file.size > MAX_MB * 1024 * 1024) return setError(`Ukuran maksimal ${MAX_MB} MB. Perkecil dulu gambarnya.`);

    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      // redirect: "manual": kalau sesi habis, middleware mengalihkan ke login;
      // jangan sampai HTML halaman login dibaca sebagai JSON.
      const res = await fetch("/admin/upload", { method: "POST", body, redirect: "manual" });
      const json = res.headers.get("content-type")?.includes("application/json")
        ? ((await res.json()) as { url?: string; error?: string })
        : null;

      if (!res.ok || !json?.url) return setError(json?.error ?? "Sesi berakhir. Muat ulang halaman lalu masuk lagi.");
      setUrl(json.url);
    } catch (err) {
      console.error("[upload]", err);
      setError("Gagal mengunggah. Periksa koneksi, lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="text-sm font-semibold text-ink">{label}</p>
      <input type="hidden" name={name} value={url} />

      <label
        className={cn(
          "relative mt-2 grid aspect-1200/630 w-full cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed transition-colors",
          busy ? "border-ink/15 bg-cream-100" : "border-ink/15 bg-white hover:border-navy-700",
        )}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload(file);
            event.target.value = "";
          }}
        />
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-ink-soft">
            <Icon.image className="h-6 w-6" />
            <span className="text-xs font-medium">{busy ? "Mengunggah…" : "Pilih gambar"}</span>
          </span>
        )}
      </label>

      <Input
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="atau tempel URL gambar"
        className="mt-3"
        aria-label="URL gambar"
      />
      <p className="mt-1.5 text-xs text-ink-soft">JPG, PNG, atau WebP, maksimal {MAX_MB} MB. Ukuran ideal 1200×630.</p>
      {url && (
        <button
          type="button"
          onClick={() => setUrl("")}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-red-700"
        >
          <Icon.trash className="h-3.5 w-3.5" />
          Hapus gambar
        </button>
      )}
      {error && <p className="mt-2 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}
