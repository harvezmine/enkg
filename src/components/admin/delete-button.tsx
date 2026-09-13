"use client";

import { useState } from "react";

import { Icon } from "@/components/icons";

/**
 * Tombol hapus dua langkah. Klik pertama meminta konfirmasi inline,
 * lebih aman daripada window.confirm dan tidak mengagetkan di layar HP.
 */
export function DeleteButton({
  action,
  id,
  label = "Hapus",
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-ink-soft transition-colors hover:text-red-700"
      >
        <Icon.trash className="h-4 w-4" />
        {label}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <form action={action}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="inline-flex h-9 items-center rounded-full bg-red-600 px-3 text-xs font-semibold text-white">
          Yakin hapus
        </button>
      </form>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold text-ink-soft"
      >
        Batal
      </button>
    </span>
  );
}
