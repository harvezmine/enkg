import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/shell";
import { adminDb } from "@/lib/admin-auth";
import { TABLES } from "@/lib/db-types";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const supabase = await adminDb();
  const { count } = await supabase
    .from(TABLES.submissions)
    .select("id", { count: "exact", head: true })
    .eq("status", "baru");

  return <AdminShell newSubmissions={count ?? 0}>{children}</AdminShell>;
}
