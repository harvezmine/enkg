import type { Metadata } from "next";

import { MaterialEditor } from "@/components/admin/materials/material-editor";
import { AdminPageHeader } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Materi baru" };

export default function NewMaterialPage() {
  return (
    <>
      <AdminPageHeader title="Materi baru" backHref="/admin/materi" />
      <MaterialEditor />
    </>
  );
}
