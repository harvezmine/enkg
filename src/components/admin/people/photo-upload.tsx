"use client";

import { useState } from "react";

import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

/** Sisi terpanjang foto setelah dikecilkan. Cukup tajam untuk kartu dan halaman detail. */
const MAX_EDGE = 1000;
const MAX_SOURCE_MB = 20;

/**
 * Foto dari HP bisa 5-10 MB. Dikecilkan dulu di browser ke JPEG supaya unggahan
 * cepat dan Storage tidak cepat penuh. Kalau browser tidak bisa membaca
 * formatnya, file asli dikirim apa adanya dan server yang menolak bila perlu.
 */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
    return blob ?? file;
  } catch {
    return file;
  }
}

/**
 * Unggah foto jemaat ke bucket privat. Field tersembunyi menyimpan path-nya
 * (bukan URL), dan pratinjaunya memakai signed URL dari server.
 */
export function PhotoUpload({
  name,
  defaultPath,
  defaultUrl,
  uploadUrl = "/admin/upload/foto",
}: {
  name: string;
  defaultPath?: string | null;
  defaultUrl?: string | null;
  /** Rute unggah. Portal leader memakai rutenya sendiri yang memeriksa sesi leader. */
  uploadUrl?: string;
}) {
  const [path, setPath] = useState(defaultPath ?? "");
  const [preview, setPreview] = useState(defaultUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) return setError("File harus berupa foto.");
    if (file.size > MAX_SOURCE_MB * 1024 * 1024) return setError(`Foto terlalu besar (maksimal ${MAX_SOURCE_MB} MB).`);

    setBusy(true);
    try {
      const body = new FormData();
      const blob = await shrink(file);
      body.append("file", blob, blob === file ? file.name : "foto.jpg");
      // redirect: "manual": kalau sesi habis, jangan baca HTML halaman login sebagai JSON.
      const res = await fetch(uploadUrl, { method: "POST", body, redirect: "manual" });
      const json = res.headers.get("content-type")?.includes("application/json")
        ? ((await res.json()) as { path?: string; url?: string | null; error?: string })
        : null;

      if (!res.ok || !json?.path) return setError(json?.error ?? "Sesi berakhir. Muat ulang halaman lalu masuk lagi.");
      setPath(json.path);
      setPreview(json.url ?? URL.createObjectURL(blob));
    } catch (err) {
      console.error("[foto]", err);
      setError("Gagal mengunggah. Periksa koneksi, lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="text-sm font-semibold text-ink">Foto</p>
      <input type="hidden" name={name} value={path} />

      <label
        className={cn(
          "relative mt-2 grid aspect-4/5 w-full cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors",
          busy ? "border-ink/15 bg-cream-100" : "border-ink/15 bg-white hover:border-navy-700",
          preview && "border-solid border-transparent",
        )}
      >
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload(file);
            event.target.value = "";
          }}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className={cn("h-full w-full object-cover", busy && "opacity-50")} />
        ) : (
          <span className="flex flex-col items-center gap-1.5 px-4 text-center text-ink-soft">
            <Icon.user className="h-7 w-7" />
            <span className="text-xs font-medium">{busy ? "Mengunggah…" : "Pilih foto"}</span>
          </span>
        )}
        {preview && (
          <span className="absolute inset-x-3 bottom-3 rounded-full bg-ink/70 py-1.5 text-center text-xs font-semibold text-white backdrop-blur">
            {busy ? "Mengunggah…" : "Ganti foto"}
          </span>
        )}
      </label>

      <p className="mt-1.5 text-xs text-ink-soft">Hanya bisa dilihat pengurus.</p>
      {preview && !busy && (
        <button
          type="button"
          onClick={() => {
            setPath("");
            setPreview("");
          }}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-red-700"
        >
          <Icon.trash className="h-3.5 w-3.5" />
          Hapus foto
        </button>
      )}
      {error && <p className="mt-2 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}
