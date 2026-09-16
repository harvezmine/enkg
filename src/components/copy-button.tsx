"use client";

import { useState } from "react";

import { Icon } from "./icons";

/** `name` membedakan tombol yang muncul lebih dari sekali, mis. dua nomor rekening. */
export function CopyButton({ value, label = "Salin nomor", name }: { value: string; label?: string; name?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard diblokir (mis. bukan HTTPS) — pengguna masih bisa menyalin manual.
    }
  };

  return (
    <button type="button" onClick={copy} aria-live="polite" className="btn btn-light px-4 py-2.5 text-sm">
      {copied ? (
        <>
          <Icon.check className="h-4 w-4 text-sun-400" /> Tersalin
        </>
      ) : (
        label
      )}
      {name && <span className="sr-only"> {name}</span>}
    </button>
  );
}
