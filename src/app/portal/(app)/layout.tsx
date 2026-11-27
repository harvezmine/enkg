import type { ReactNode } from "react";

import { PortalShell } from "@/components/portal/shell";
import { requireLeader } from "@/lib/leader-auth";

export const dynamic = "force-dynamic";

/**
 * Layout tidak dirender ulang saat pindah halaman, jadi pemeriksaan di sini
 * hanya untuk data kerangka. Setiap halaman tetap memanggil requireLeader().
 */
export default async function PortalAppLayout({ children }: { children: ReactNode }) {
  // Admin yang bukan leader diarahkan ke admin panel, bukan dikeluarkan.
  const context = await requireLeader({ allowPasswordChange: true });

  return (
    <PortalShell
      groupName={context.lifeGroup.name}
      leaderName={context.person.nickname || context.person.full_name}
      locked={context.account.must_change_password}
      isAdmin={context.isAdmin}
    >
      {children}
    </PortalShell>
  );
}
