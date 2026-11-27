"use client";

import { PageError } from "@/components/admin/page-states";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError error={error} reset={reset} homeHref="/admin" homeLabel="Ke Ringkasan" />;
}
