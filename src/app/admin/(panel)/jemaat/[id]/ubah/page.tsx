import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DbError } from "@/components/admin/db-error";
import { PersonEditor } from "@/components/admin/people/person-editor";
import { AdminPageHeader } from "@/components/admin/ui";
import { adminDb } from "@/lib/admin-auth";
import { loadDirectory, signPhoto } from "@/lib/people-data";

import { editorOptions } from "../../editor-data";

export const metadata: Metadata = { title: "Ubah data jemaat" };
export const dynamic = "force-dynamic";

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await adminDb();
  const dir = await loadDirectory(supabase);
  const person = dir.people.find((p) => p.id === id);

  if (dir.error) {
    return (
      <>
        <AdminPageHeader title="Ubah data jemaat" backHref={`/admin/jemaat/${id}`} />
        <DbError error={dir.error} />
      </>
    );
  }
  if (!person) notFound();

  const options = editorOptions(dir);
  // Grup yang sedang tidak aktif tetap muncul untuk orang yang masih tercatat di sana.
  const current = dir.lifeGroups.find((g) => g.id === person.life_group_id);
  const lifeGroups =
    current && !current.is_active
      ? [...options.lifeGroups, { id: current.id, name: current.name, segment: current.segment }]
      : options.lifeGroups;

  return (
    <>
      <AdminPageHeader title={`Ubah data ${person.nickname || person.full_name}`} backHref={`/admin/jemaat/${id}`} />
      <PersonEditor
        person={person}
        photoUrl={person.photo_path ? await signPhoto(supabase, person.photo_path) : null}
        areas={options.areas}
        lifeGroups={lifeGroups}
      />
    </>
  );
}
