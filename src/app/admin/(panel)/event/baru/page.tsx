import type { Metadata } from "next";

import { EventEditor } from "@/components/admin/event-editor";
import { AdminPageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Event baru" };

export default async function NewEventPage({ searchParams }: { searchParams: Promise<{ kategori?: string }> }) {
  const { kategori } = await searchParams;
  const procon = kategori === "procon";

  return (
    <>
      <AdminPageHeader
        title={procon ? "ProCon baru" : "Event baru"}
        backHref={procon ? "/admin/event?kategori=procon" : "/admin/event"}
      />
      <EventEditor defaultCategory={procon ? "procon" : "gereja"} />
    </>
  );
}
