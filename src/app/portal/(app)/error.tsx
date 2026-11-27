"use client";

import { PageError } from "@/components/admin/page-states";

export default function PortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <PageError error={error} reset={reset} homeHref="/portal" homeLabel="Ke beranda portal" />;
}
