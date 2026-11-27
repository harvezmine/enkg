import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { PortalShell } from "@/components/portal/shell";
import { getLeaderContext } from "@/lib/leader-auth";

export const dynamic = "force-dynamic";

/**
 * Layout tidak dirender ulang saat pindah halaman, jadi pemeriksaan di sini
 * hanya untuk data kerangka. Setiap halaman tetap memanggil requireLeader().
 */
export default async function PortalAppLayout({ children }: { children: ReactNode }) {
  const context = await getLeaderContext();
  if (!context) redirect("/portal/keluar?alasan=sesi");

  return (
    <PortalShell
      groupName={context.lifeGroup.name}
      leaderName={context.person.nickname || context.person.full_name}
      locked={context.account.must_change_password}
    >
      {children}
    </PortalShell>
  );
}
