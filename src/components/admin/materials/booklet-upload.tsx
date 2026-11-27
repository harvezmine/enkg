"use client";

import { useState } from "react";

import { Icon } from "@/components/icons";
import { MATERIAL_MAX_BYTES, MATERIAL_MAX_MB } from "@/lib/materials";
import { formatBytes } from "@/lib/portal-format";
import { cn } from "@/lib/utils";

type Booklet = { path: string; name: string; size: number };

/** PUT langsung ke signed upload URL Supabase, dengan progres (fetch belum punya progres unggah). */
function putWithProgress(url: string, file: File, onProgress: (ratio: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", "application/pdf");
    xhr.setRequestHeader("cache-control", "max-age=3600");
    xhr.setRequestHeader("x-upsert", "false");
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anon) xhr.setRequestHeader("apikey", anon);
    xhr.upload.onprogress = (event) => event.lengthComputable && onProgress(event.loaded / event.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
}

/**
 * Unggah booklet PDF ke bucket privat enkg-materials. Server hanya membuat
 * signed upload URL; file-nya dikirim browser langsung ke Supabase, jadi
 * booklet besar tidak tertahan batas ukuran nginx.
 */
export function BookletUpload({ defaultValue }: { defaultValue: Booklet | null }) {
  const [booklet, setBooklet] = useState<Booklet | null>(defaultValue);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = progress !== null;

  const upload = async (file: File) => {
    setError(null);
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) return setError("Booklet harus berupa file PDF.");
    if (file.size > MATERIAL_MAX_BYTES) return setError(`Ukuran maksimal ${MATERIAL_MAX_MB} MB. Kecilkan dulu PDF-nya.`);

    setProgress(0);
    try {
      const res = await fetch("/admin/upload/materi", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "application/pdf", size: file.size }),
        redirect: "manual",
      });
      const json = res.headers.get("content-type")?.includes("application/json")
        ? ((await res.json()) as { path?: string; signedUrl?: string; error?: string })
        : null;
      if (!res.ok || !json?.path || !json.signedUrl) {
        setError(json?.error ?? "Sesi berakhir. Muat ulang halaman lalu masuk lagi.");
        return;
      }
      await putWithProgress(json.signedUrl, file, setProgress);
      setBooklet({ path: json.path, name: file.name, size: file.size });
    } catch (err) {
      console.error("[booklet]", err);
      setError("Gagal mengunggah. Periksa koneksi, lalu coba lagi.");
    } finally {
      setProgress(null);
    }
  };

  return (
    <div>
      <p className="text-sm font-semibold text-ink">Booklet (PDF)</p>
      <input type="hidden" name="file_path" value={booklet?.path ?? ""} />
      <input type="hidden" name="file_name" value={booklet?.name ?? ""} />
      <input type="hidden" name="file_size" value={booklet ? String(booklet.size) : ""} />

      {booklet && !busy ? (
        <div className="mt-2 flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-ink/10">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-red-50 text-[11px] font-bold text-red-700">PDF</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">{booklet.name}</span>
            <span className="block text-xs text-ink-soft">{formatBytes(booklet.size)}</span>
          </span>
          <button
            type="button"
            onClick={() => setBooklet(null)}
            aria-label="Hapus booklet"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-red-50 hover:text-red-700"
          >
            <Icon.trash className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          className={cn(
            "mt-2 flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors",
            busy ? "border-ink/15 bg-cream-100" : "border-ink/15 bg-white hover:border-navy-700",
          )}
        >
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload(file);
              event.target.value = "";
            }}
          />
          <Icon.news className="h-6 w-6 text-ink-soft" />
          <span className="text-xs font-medium text-ink-soft">
            {busy ? `Mengunggah… ${Math.round((progress ?? 0) * 100)}%` : "Pilih file PDF"}
          </span>
          {busy && (
            <span className="mt-1 h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-ink/10">
              <span className="block h-full rounded-full bg-navy-700 transition-[width]" style={{ width: `${(progress ?? 0) * 100}%` }} />
            </span>
          )}
        </label>
      )}
      <p className="mt-1.5 text-xs text-ink-soft">Maksimal {MATERIAL_MAX_MB} MB. Hanya bisa diunduh leader dan admin.</p>
      {error && <p className="mt-2 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}
