import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/shell";
import { adminDb } from "@/lib/admin-auth";
import { getSession } from "@/lib/auth";
import { TABLES } from "@/lib/db-types";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  // Halaman ganti password juga di dalam panel, jadi layout tidak memaksa ganti di sini.
  const supabase = await adminDb({ allowPasswordChange: true });
  const session = (await getSession())!;
  const { count } = await supabase
    .from(TABLES.submissions)
    .select("id", { count: "exact", head: true })
    .eq("status", "baru");

  return (
    <AdminShell
      newSubmissions={count ?? 0}
      user={{ name: session.account.name, email: session.account.email, leaderOf: session.lifeGroup?.name ?? null }}
    >
      {children}
    </AdminShell>
  );
}
