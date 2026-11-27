import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DbError } from "@/components/admin/db-error";
import { MaterialEditor } from "@/components/admin/materials/material-editor";
import { AdminPageHeader } from "@/components/admin/ui";
import { adminDb } from "@/lib/admin-auth";
import { TABLES, type LgMaterial } from "@/lib/db-types";

export const metadata: Metadata = { title: "Ubah materi" };
export const dynamic = "force-dynamic";

export default async function EditMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await adminDb();
  const { data, error } = await supabase.from(TABLES.lgMaterials).select("*").eq("id", id).maybeSingle();

  if (error) {
    return (
      <>
        <AdminPageHeader title="Ubah materi" backHref="/admin/materi" />
        <DbError error={error} />
      </>
    );
  }
  if (!data) notFound();

  return (
    <>
      <AdminPageHeader title="Ubah materi" backHref="/admin/materi" />
      <MaterialEditor material={data as LgMaterial} />
    </>
  );
}
