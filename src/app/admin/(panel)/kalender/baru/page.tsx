import type { Metadata } from "next";

import { ScheduleEditor } from "@/components/admin/schedule-editor";
import { AdminPageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Jadwal baru" };

export default function NewSchedulePage() {
  return (
    <>
      <AdminPageHeader
        title="Jadwal baru"
        backHref="/admin/kalender"
      />
      <ScheduleEditor />
    </>
  );
}
