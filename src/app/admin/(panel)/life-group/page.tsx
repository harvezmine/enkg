import type { Metadata } from "next";
import Link from "next/link";

import { DbError } from "@/components/admin/db-error";
import { AssignLifeGroupForm, LifeGroupForm, type GroupOption } from "@/components/admin/life-group/forms";
import { PersonAvatar } from "@/components/admin/people/avatar";
import { AdminPageHeader, Badge, Card, EmptyState, Notice } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { adminDb } from "@/lib/admin-auth";
import { LIFE_GROUP_SEGMENT_LABEL, TABLES, type ContactSubmission, type LifeGroup, type Person } from "@/lib/db-types";
import { leaderNotice } from "@/lib/life-group-notify";
import { scheduleLabel } from "@/lib/life-groups";
import { ageOn, todayWib } from "@/lib/people";
import { loadDirectory, signPhotos } from "@/lib/people-data";
import { segmentFromLabel } from "@/lib/people-options";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Life Group" };
export const dynamic = "force-dynamic";

const firstName = (p: Pick<Person, "nickname" | "full_name">) => p.nickname || p.full_name.split(" ")[0]!;

export default async function LifeGroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ baru?: string; assigned?: string; deleted?: string }>;
}) {
  const params = await searchParams;
  const supabase = await adminDb();
  const dir = await loadDirectory(supabase);
  const today = todayWib();

  const membersOf = (groupId: string) => dir.people.filter((p) => p.life_group_id === groupId);
  const leadersOf = (groupId: string) => membersOf(groupId).filter((p) => p.life_group_role === "leader");

  // Antrean: jemaat baru yang belum punya Life Group, yang paling lama menunggu dulu.
  const waiting = dir.people
    .filter((p) => p.status === "baru" && !p.life_group_id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const submissionIds = waiting.map((p) => p.submission_id).filter((id): id is string => Boolean(id));

  const [photos, submissions, notice] = await Promise.all([
    signPhotos(supabase, [
      ...waiting.map((p) => p.photo_path),
      ...dir.lifeGroups.flatMap((g) => membersOf(g.id).slice(0, 5).map((p) => p.photo_path)),
    ]),
    submissionIds.length
      ? supabase.from(TABLES.submissions).select("id, life_group").in("id", submissionIds)
      : Promise.resolve({ data: [] as Pick<ContactSubmission, "id" | "life_group">[] }),
    params.assigned ? leaderNotice(supabase, params.assigned) : Promise.resolve(null),
  ]);
  const wish = new Map((submissions.data ?? []).map((s) => [s.id, s.life_group]));
  const photo = (p: Person) => (p.photo_path ? photos.get(p.photo_path) : null);

  const groupOptions: GroupOption[] = dir.lifeGroups
    .filter((g) => g.is_active)
    .map((g) => ({ id: g.id, name: g.name, segment: g.segment, leaders: leadersOf(g.id).map(firstName).join(", ") }));

  const groups = [...dir.lifeGroups].sort((a, b) => Number(b.is_active) - Number(a.is_active) || a.name.localeCompare(b.name, "id"));
  const totalMembers = dir.people.filter((p) => p.life_group_id).length;

  return (
    <>
      <AdminPageHeader
        title="Life Group"
        description={
          dir.lifeGroups.length
            ? `${dir.lifeGroups.length} grup, ${totalMembers} orang sudah tergabung.`
            : "Kelompok kecil beserta leader dan anggotanya."
        }
        action={
          !params.baru && (
            <Link href="/admin/life-group?baru=1" className="btn btn-navy px-4 py-2.5 text-sm">
              <Icon.plus className="h-4 w-4" /> Life Group baru
            </Link>
          )
        }
      />

      <DbError error={dir.error} />
      {params.deleted && (
        <div className="mb-6">
          <Notice tone="success">Life Group sudah dihapus. Anggotanya kembali ke daftar belum punya grup.</Notice>
        </div>
      )}
      {notice && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2.5 text-sm text-emerald-800">
            <Icon.check className="mt-0.5 h-4 w-4 shrink-0" />
            {notice.message}
          </p>
          {notice.notify && (
            <a href={notice.notify.href} target="_blank" rel="noopener noreferrer" className="btn btn-wa shrink-0 px-4 py-2.5 text-sm">
              <Icon.whatsapp className="h-4 w-4" />
              {notice.notify.label}
            </a>
          )}
        </div>
      )}

      {params.baru && (
        <Card className="mb-8 p-4 sm:p-6">
          <h2 className="font-display mb-5 text-lg font-bold text-ink">Life Group baru</h2>
          <LifeGroupForm cancelHref="/admin/life-group" />
        </Card>
      )}

      {/* ── Antrean jemaat baru ─────────────────────────────────────────── */}
      {waiting.length > 0 && (
        <section className="mb-10">
          <div className="mb-4">
            <h2 className="font-display text-xl font-bold text-ink">Jemaat baru menunggu Life Group</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Pilih grupnya, lalu kabari leader-nya supaya mereka disapa minggu ini.
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {waiting.map((person) => {
              const wanted = person.submission_id ? wish.get(person.submission_id) : null;
              return (
                <li key={person.id} className="min-w-0">
                  <Card className="flex h-full flex-col p-4 ring-sun-500/40">
                    <div className="flex items-center gap-3">
                      <PersonAvatar person={person} photoUrl={photo(person)} className="h-12 w-12 shrink-0 rounded-full text-sm" />
                      <div className="min-w-0">
                        <Link href={`/admin/jemaat/${person.id}`} className="block truncate font-semibold text-ink hover:underline">
                          {person.full_name}
                        </Link>
                        <p className="truncate text-xs text-ink-soft">
                          {[
                            person.birth_date ? `${ageOn(person.birth_date, today)} tahun` : null,
                            person.area,
                            `masuk ${formatDate(person.created_at)}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    </div>
                    {wanted && (
                      <p className="mt-3 text-xs text-ink">
                        <Badge tone="sun">Ingin gabung {wanted}</Badge>
                      </p>
                    )}
                    <div className="mt-auto pt-4">
                      <AssignLifeGroupForm
                        personId={person.id}
                        groups={groupOptions}
                        suggested={segmentFromLabel(wanted)}
                        returnTo="/admin/life-group"
                        compact
                      />
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ── Daftar grup ─────────────────────────────────────────────────── */}
      {groups.length ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => {
            const members = membersOf(group.id);
            const leaders = leadersOf(group.id);
            return (
              <li key={group.id}>
                <Link href={`/admin/life-group/${group.id}`} className="group block h-full">
                  <Card className={`flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift ${group.is_active ? "" : "opacity-60"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-1.5">
                          {group.segment && <Badge tone="navy">{LIFE_GROUP_SEGMENT_LABEL[group.segment]}</Badge>}
                          {!group.is_active && <Badge tone="gray">Berhenti</Badge>}
                          {group.show_on_calendar && <Badge tone="green">Di kalender</Badge>}
                        </div>
                        <h2 className="font-display mt-2.5 text-lg leading-snug font-bold text-ink">{group.name}</h2>
                      </div>
                      <p className="font-display tabular shrink-0 text-right text-3xl leading-none font-bold text-navy-700">
                        {members.length}
                        <span className="mt-1 block text-[11px] font-medium text-ink-soft">orang</span>
                      </p>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-soft">
                      <Icon.clock className="h-4 w-4 shrink-0" />
                      {scheduleLabel(group)}
                    </p>
                    {group.area && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
                        <Icon.mapPin className="h-4 w-4 shrink-0" />
                        {group.area}
                      </p>
                    )}

                    <div className="mt-auto flex items-center gap-3 pt-5">
                      {members.length > 0 && (
                        <div className="flex -space-x-2.5">
                          {members.slice(0, 5).map((member) => (
                            <PersonAvatar
                              key={member.id}
                              person={member}
                              photoUrl={photo(member)}
                              className="h-9 w-9 rounded-full text-[11px] ring-2 ring-white"
                            />
                          ))}
                        </div>
                      )}
                      <p className="min-w-0 text-xs leading-snug text-ink-soft">
                        {leaders.length ? (
                          <>
                            Leader: <span className="font-semibold text-ink">{leaders.map(firstName).join(", ")}</span>
                          </>
                        ) : (
                          <span className="font-semibold text-red-700">Belum ada leader</span>
                        )}
                      </p>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        !dir.error &&
        !params.baru && (
          <EmptyState
            title="Belum ada Life Group"
            description="Buat grupnya dulu, lalu tunjuk leader dan masukkan anggotanya."
            action={
              <Link href="/admin/life-group?baru=1" className="btn btn-navy px-4 py-2.5 text-sm">
                <Icon.plus className="h-4 w-4" /> Life Group baru
              </Link>
            }
          />
        )
      )}
    </>
  );
}
