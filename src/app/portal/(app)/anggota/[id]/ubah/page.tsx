import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/ui";
import { MemberEditor } from "@/components/portal/member-editor";
import { TABLES } from "@/lib/db-types";
import { MEMBER_COLUMNS, requireLeader, type PortalMember } from "@/lib/leader-auth";
import { signPhoto } from "@/lib/people-data";

export const metadata: Metadata = { title: "Ubah data anggota" };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await requireLeader();
  if (!UUID.test(id)) notFound();

  // Hanya anggota grup leader ini; orang di grup lain diperlakukan tidak ada.
  const { data } = await context.supabase
    .from(TABLES.people)
    .select(MEMBER_COLUMNS)
    .eq("id", id)
    .eq("life_group_id", context.lifeGroup.id)
    .maybeSingle<PortalMember>();
  if (!data) notFound();

  const isSelf = data.id === context.person.id;
  const name = data.nickname || data.full_name.split(" ")[0];

  return (
    <>
      <AdminPageHeader
        title={isSelf ? "Ubah data kamu" : `Ubah data ${name}`}
        backHref="/portal/anggota"
      />
      <MemberEditor
        member={data}
        photoUrl={data.photo_path ? await signPhoto(context.supabase, data.photo_path) : null}
        isSelf={isSelf}
      />
    </>
  );
}
