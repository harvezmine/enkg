import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteTeam, removeMembership } from "@/app/actions/people";
import { DbError } from "@/components/admin/db-error";
import { DeleteButton } from "@/components/admin/delete-button";
import { MemberRoleEditor, MembershipForm, TeamForm } from "@/components/admin/people/forms";
import { PersonCard } from "@/components/admin/people/person-card";
import { AdminPageHeader, Card, EmptyState, Notice } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { adminDb } from "@/lib/admin-auth";
import { familyOf, familySummary, todayWib } from "@/lib/people";
import { indexDirectory, loadDirectory, signPhotos } from "@/lib/people-data";
import { pickerOption } from "@/lib/people-options";

export const metadata: Metadata = { title: "Pelayanan" };
export const dynamic = "force-dynamic";

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ubah?: string; saved?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await adminDb();
  const dir = await loadDirectory(supabase);

  if (dir.error) {
    return (
      <>
        <AdminPageHeader title="Pelayanan" backHref="/admin/pelayanan" />
        <DbError error={dir.error} />
      </>
    );
  }

  const index = indexDirectory(dir);
  const team = index.teamsById.get(id);
  if (!team) notFound();

  const today = todayWib();
  const members = dir.members
    .filter((m) => m.team_id === team.id)
    .flatMap((m) => {
      const person = index.peopleById.get(m.person_id);
      return person ? [{ member: m, person }] : [];
    })
    .sort(
      (a, b) =>
        Number(b.member.is_lead) - Number(a.member.is_lead) ||
        a.person.full_name.localeCompare(b.person.full_name, "id"),
    );
  const memberIds = new Set(members.map(({ person }) => person.id));
  const photos = await signPhotos(supabase, members.map(({ person }) => person.photo_path));
  const candidates = dir.people.filter((p) => !memberIds.has(p.id)).map((p) => pickerOption(p, today, index.groupsById));

  return (
    <>
      <AdminPageHeader
        title={team.name}
        description={team.description ?? undefined}
        backHref="/admin/pelayanan"
        action={
          !query.ubah && (
            <Link href={`/admin/pelayanan/${team.id}?ubah=1`} className="btn btn-outline px-4 py-2.5 text-sm">
              <Icon.edit className="h-4 w-4" /> Ubah tim
            </Link>
          )
        }
      />

      {query.ubah && (
        <Card className="mb-8 p-4 sm:p-6">
          <h2 className="font-display mb-5 text-lg font-bold text-ink">Ubah tim</h2>
          <TeamForm team={team} cancelHref={`/admin/pelayanan/${team.id}`} />
        </Card>
      )}

      <Card className="mb-8 p-4 sm:p-6">
        <h2 className="font-display mb-4 text-lg font-bold text-ink">Tambah pelayan</h2>
        <MembershipForm teamId={team.id} people={candidates} />
      </Card>

      {members.length ? (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {members.map(({ member, person }) => (
            <li key={member.id}>
              <PersonCard
                person={person}
                photoUrl={person.photo_path ? photos.get(person.photo_path) : null}
                today={today}
                chips={[
                  ...(member.is_lead ? [{ label: "Koordinator", lead: true }] : []),
                  ...(member.role ? [{ label: member.role }] : []),
                ]}
                family={familySummary(familyOf(person, dir.relationships, index.peopleById))}
                footer={
                  <div className="flex flex-wrap items-start justify-between gap-1">
                    <MemberRoleEditor teamId={team.id} personId={person.id} role={member.role} isLead={member.is_lead} />
                    <form action={removeMembership}>
                      <input type="hidden" name="id" value={member.id} />
                      <button type="submit" className="inline-flex h-8 items-center rounded-full px-2 text-xs font-semibold text-ink-soft transition hover:text-red-700">
                        Keluarkan
                      </button>
                    </form>
                  </div>
                }
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Belum ada pelayan di tim ini" />
      )}

      <div className="mt-10 flex justify-end">
        <DeleteButton action={deleteTeam} id={team.id} label="Hapus tim" />
      </div>
    </>
  );
}
