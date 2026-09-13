import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DbError } from "@/components/admin/db-error";
import { EventEditor } from "@/components/admin/event-editor";
import { AdminPageHeader } from "@/components/admin/ui";
import { adminDb } from "@/lib/admin-auth";
import { TABLES, type ChurchEvent } from "@/lib/db-types";

export const metadata: Metadata = { title: "Ubah event" };
export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await adminDb();
  const { data, error } = await supabase.from(TABLES.events).select("*").eq("id", id).maybeSingle();

  if (error) {
    return (
      <>
        <AdminPageHeader title="Ubah event" backHref="/admin/event" />
        <DbError error={error} />
      </>
    );
  }
  if (!data) notFound();

  const event = data as ChurchEvent;
  return (
    <>
      <AdminPageHeader
        title={event.category === "procon" ? "Ubah ProCon" : "Ubah event"}
        backHref={event.category === "procon" ? "/admin/event?kategori=procon" : "/admin/event"}
      />
      <EventEditor event={event} />
    </>
  );
}
