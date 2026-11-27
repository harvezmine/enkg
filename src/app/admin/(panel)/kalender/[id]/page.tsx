import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DbError } from "@/components/admin/db-error";
import { ScheduleEditor } from "@/components/admin/schedule-editor";
import { AdminPageHeader } from "@/components/admin/ui";
import { adminDb } from "@/lib/admin-auth";
import { TABLES, type ScheduleRow } from "@/lib/db-types";

export const metadata: Metadata = { title: "Ubah jadwal" };
export const dynamic = "force-dynamic";

export default async function EditSchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await adminDb();
  const { data, error } = await supabase.from(TABLES.schedule).select("*").eq("id", id).maybeSingle();

  if (error) {
    return (
      <>
        <AdminPageHeader title="Ubah jadwal" backHref="/admin/kalender" />
        <DbError error={error} />
      </>
    );
  }
  if (!data) notFound();

  return (
    <>
      <AdminPageHeader title="Ubah jadwal" backHref="/admin/kalender" />
      <ScheduleEditor row={data as ScheduleRow} />
    </>
  );
}
