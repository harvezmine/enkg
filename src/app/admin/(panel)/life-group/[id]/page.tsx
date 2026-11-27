import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { deleteLifeGroup, removeFromLifeGroup, setLifeGroupRole } from "@/app/actions/life-groups";
import { DbError } from "@/components/admin/db-error";
import { DeleteButton } from "@/components/admin/delete-button";
import { AssignLifeGroupForm, LifeGroupForm } from "@/components/admin/life-group/forms";
import { PersonCard } from "@/components/admin/people/person-card";
import { AdminPageHeader, Badge, Card, EmptyState, Notice } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { adminDb } from "@/lib/admin-auth";
import { LIFE_GROUP_SEGMENT_LABEL, TABLES, type Account, type Person } from "@/lib/db-types";
import { scheduleLabel } from "@/lib/life-groups";
import { familyOf, familySummary, todayWib } from "@/lib/people";
import { indexDirectory, loadDirectory, signPhotos, teamChips } from "@/lib/people-data";
import { pickerOption } from "@/lib/people-options";

export const metadata: Metadata = { title: "Life Group" };
export const dynamic = "force-dynamic";

function RoleActions({ person, groupId }: { person: Person; groupId: string }) {
  const leader = person.life_group_role === "leader";
  return (
    <div className="flex flex-wrap items-center justify-between gap-1">
      <form action={setLifeGroupRole}>
        <input type="hidden" name="person_id" value={person.id} />
        <input type="hidden" name="life_group_id" value={groupId} />
        <input type="hidden" name="role" value={leader ? "anggota" : "leader"} />
        <button type="submit" className="inline-flex h-8 items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-navy-700 transition hover:bg-navy-50">
          <Icon.star className="h-3.5 w-3.5" />
          {leader ? "Jadikan anggota" : "Jadikan leader"}
        </button>
      </form>
      <form action={removeFromLifeGroup}>
        <input type="hidden" name="person_id" value={person.id} />
        <input type="hidden" name="life_group_id" value={groupId} />
        <button type="submit" className="inline-flex h-8 items-center rounded-full px-2 text-xs font-semibold text-ink-soft transition hover:text-red-700">
          Keluarkan
        </button>
      </form>
    </div>
  );
}

export default async function LifeGroupPage({
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
        <AdminPageHeader title="Life Group" backHref="/admin/life-group" />
        <DbError error={dir.error} />
      </>
    );
  }

  const index = indexDirectory(dir);
  const group = index.groupsById.get(id);
  if (!group) notFound();

  const today = todayWib();
  const members = dir.people
    .filter((p) => p.life_group_id === group.id)
    .sort((a, b) => Number(b.life_group_role === "leader") - Number(a.life_group_role === "leader"));
  const leaders = members.filter((p) => p.life_group_role === "leader");

  const [photos, accounts] = await Promise.all([
    signPhotos(supabase, members.map((p) => p.photo_path)),
    leaders.length
      ? supabase.from(TABLES.accounts).select("person_id, is_active").in("person_id", leaders.map((p) => p.id))
      : Promise.resolve({ data: [] as Pick<Account, "person_id" | "is_active">[] }),
  ]);
  const accountOf = new Map((accounts.data ?? []).map((a) => [a.person_id, a]));

  const memberIds = new Set(members.map((p) => p.id));
  const candidates = dir.people.filter((p) => !memberIds.has(p.id)).map((p) => pickerOption(p, today, index.groupsById));

  const card = (person: Person, footer: ReactNode) => (
    <PersonCard
      person={person}
      photoUrl={person.photo_path ? photos.get(person.photo_path) : null}
      today={today}
      chips={[
        ...(person.life_group_role === "leader" ? [{ label: "Leader", lead: true }] : []),
        ...teamChips(person.id, index),
      ]}
      family={familySummary(familyOf(person, dir.relationships, index.peopleById))}
      footer={footer}
    />
  );

  return (
    <>
      <AdminPageHeader
        title={group.name}
        description={[group.segment ? LIFE_GROUP_SEGMENT_LABEL[group.segment] : null, scheduleLabel(group), group.area]
          .filter(Boolean)
          .join(" · ")}
        backHref="/admin/life-group"
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/life-group/${group.id}/laporan`} className="btn btn-navy px-4 py-2.5 text-sm">
              <Icon.news className="h-4 w-4" /> Laporan pertemuan
            </Link>
            {!query.ubah && (
              <Link href={`/admin/life-group/${group.id}?ubah=1`} className="btn btn-outline px-4 py-2.5 text-sm">
                <Icon.edit className="h-4 w-4" /> Ubah
              </Link>
            )}
          </div>
        }
      />


      {query.ubah ? (
        <Card className="mb-8 p-4 sm:p-6">
          <h2 className="font-display mb-5 text-lg font-bold text-ink">Ubah Life Group</h2>
          <LifeGroupForm group={group} cancelHref={`/admin/life-group/${group.id}`} />
        </Card>
      ) : (
        (group.location || group.description || !group.is_active) && (
          <Card className="mb-8 space-y-2 p-4 text-sm sm:p-5">
            {!group.is_active && <Badge tone="gray">Grup sedang berhenti</Badge>}
            {group.location && (
              <p className="flex items-start gap-2 text-ink">
                <Icon.mapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />
                {group.location}
              </p>
            )}
            {group.description && <p className="leading-relaxed text-ink-soft">{group.description}</p>}
          </Card>
        )
      )}

      {/* ── Leader ──────────────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="font-display mb-4 text-xl font-bold text-ink">Leader</h2>
        {leaders.length ? (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {leaders.map((person) => {
              const account = accountOf.get(person.id);
              return (
                <li key={person.id}>
                  {card(
                    person,
                    <div className="space-y-1">
                      <Link href={`/admin/jemaat/${person.id}#akun-portal`} className="block py-1">
                        <Badge tone={account?.is_active ? "green" : account ? "gray" : "sun"}>
                          {account?.is_active ? "Akun portal aktif" : account ? "Akun portal nonaktif" : "Belum punya akun portal"}
                        </Badge>
                      </Link>
                      <RoleActions person={person} groupId={group.id} />
                    </div>,
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
            Grup ini belum punya leader.
          </p>
        )}
      </section>

      {/* ── Tambah orang ────────────────────────────────────────────────── */}
      <Card className="mb-10 p-4 sm:p-6">
        <h2 className="font-display mb-4 text-lg font-bold text-ink">Masukkan ke grup ini</h2>
        <AssignLifeGroupForm groupId={group.id} people={candidates} />
      </Card>

      {/* ── Anggota ─────────────────────────────────────────────────────── */}
      <section>
        <h2 className="font-display mb-4 text-xl font-bold text-ink">
          Anggota <span className="tabular text-ink-soft">({members.length - leaders.length})</span>
        </h2>
        {members.length > leaders.length ? (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {members
              .filter((p) => p.life_group_role !== "leader")
              .map((person) => (
                <li key={person.id}>{card(person, <RoleActions person={person} groupId={group.id} />)}</li>
              ))}
          </ul>
        ) : (
          <EmptyState title="Belum ada anggota" />
        )}
      </section>

      <div className="mt-10 flex justify-end">
        <DeleteButton action={deleteLifeGroup} id={group.id} label="Hapus Life Group" />
      </div>
    </>
  );
}
