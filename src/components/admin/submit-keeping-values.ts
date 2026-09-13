"use client";

import { startTransition, type FormEvent } from "react";

/**
 * React 19 mengosongkan form setelah `<form action>` selesai. Di editor admin,
 * tulisan panjang tidak boleh hilang hanya karena validasi gagal, jadi form
 * dikirim lewat onSubmit + startTransition tanpa reset otomatis.
 */
export function submitKeepingValues(action: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => action(formData));
  };
}
