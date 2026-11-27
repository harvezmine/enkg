import type { Metadata } from "next";

import { DbError } from "@/components/admin/db-error";
import { PersonEditor, type PersonDefaults, type RelateIntent } from "@/components/admin/people/person-editor";
import { AdminPageHeader } from "@/components/admin/ui";
import { adminDb } from "@/lib/admin-auth";
import { TABLES, type ContactSubmission } from "@/lib/db-types";
import { RELATION_AS_OPTIONS, familyOf, type RelationAs } from "@/lib/people";
import { indexDirectory, loadDirectory } from "@/lib/people-data";
import { formatDate } from "@/lib/utils";

import { editorOptions } from "../editor-data";

export const metadata: Metadata = { title: "Jemaat baru" };
export const dynamic = "force-dynamic";

export default async function NewPersonPage({
  searchParams,
}: {
  searchParams: Promise<{ dari?: string; sebagai?: string; kiriman?: string }>;
}) {
  const { dari, sebagai, kiriman } = await searchParams;
  const supabase = await adminDb();
  const dir = await loadDirectory(supabase);
  const index = indexDirectory(dir);
  const options = editorOptions(dir);

  // Dari "Tambah anggota keluarga": catat relasinya sekalian, dan pakai alamat
  // yang sama untuk pasangan dan anak.
  let relate: RelateIntent | undefined;
  let defaults: PersonDefaults | undefined;
  const source = dari ? index.peopleById.get(dari) : undefined;
  const as = RELATION_AS_OPTIONS.find((option) => option.value === sebagai);
  if (source && as) {
    const family = familyOf(source, dir.relationships, index.peopleById);
    relate = {
      toId: source.id,
      toName: source.full_name,
      as: as.value as RelationAs,
      label: as.label.toLowerCase(),
      spouses: family.filter((m) => m.as === "pasangan").map((m) => ({ id: m.person.id, name: m.person.full_name })),
    };
    if (as.value === "pasangan" || as.value === "anak") {
      defaults = { address: source.address, area: source.area };
      if (as.value === "pasangan") defaults.life_group_id = source.life_group_id;
    }
  }

  // Dari kiriman "Gabung Life Group" di Contact Us.
  let submission: { id: string; summary: string } | undefined;
  if (kiriman && !relate) {
    const { data } = await supabase.from(TABLES.submissions).select("*").eq("id", kiriman).maybeSingle();
    const item = data as ContactSubmission | null;
    if (item) {
      submission = {
        id: item.id,
        summary: [item.name, item.life_group && `ingin gabung ${item.life_group}`, formatDate(item.created_at)]
          .filter(Boolean)
          .join(", "),
      };
      defaults = {
        full_name: item.name,
        phone: item.phone,
        gender: item.gender === "Perempuan" ? "P" : item.gender?.startsWith("Laki") ? "L" : null,
        area: item.domicile,
        status: "baru",
        notes: [item.age_range && `Usia: ${item.age_range}`, item.life_group && `Ingin gabung Life Group ${item.life_group}`]
          .filter(Boolean)
          .join("\n"),
      };
    }
  }

  return (
    <>
      <AdminPageHeader
        title={relate ? `Keluarga ${relate.toName}` : "Jemaat baru"}
        backHref={source ? `/admin/jemaat/${source.id}` : "/admin/jemaat"}
      />
      <DbError error={dir.error} />
      <PersonEditor
        areas={options.areas}
        lifeGroups={options.lifeGroups}
        relate={relate}
        defaults={defaults}
        submission={submission}
      />
    </>
  );
}
