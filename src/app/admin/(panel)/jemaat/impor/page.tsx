import type { Metadata } from "next";

import { DbError } from "@/components/admin/db-error";
import { ImportWizard } from "@/components/admin/people/import-wizard";
import { AdminPageHeader } from "@/components/admin/ui";
import { adminDb } from "@/lib/admin-auth";
import { loadDirectory } from "@/lib/people-data";

export const metadata: Metadata = { title: "Impor jemaat dari Excel" };
export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const supabase = await adminDb();
  const dir = await loadDirectory(supabase);

  return (
    <>
      <AdminPageHeader
        title="Impor dari Excel"
        description="Masukkan banyak data jemaat sekaligus. Semua baris diperiksa dulu sebelum disimpan."
        backHref="/admin/jemaat"
      />
      <DbError error={dir.error} />
      <ImportWizard
        existing={dir.people.map(({ id, full_name, phone, birth_date }) => ({ id, full_name, phone, birth_date }))}
        lifeGroups={dir.lifeGroups.map(({ name }) => ({ name }))}
        teams={dir.teams.map(({ name }) => ({ name }))}
      />
    </>
  );
}
