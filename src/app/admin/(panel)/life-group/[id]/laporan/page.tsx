import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PersonAvatar } from "@/components/admin/people/avatar";
import { DbError } from "@/components/admin/db-error";
import { AdminPageHeader, Badge, Card, EmptyState } from "@/components/admin/ui";
import { adminDb } from "@/lib/admin-auth";
import { TABLES, type LgMaterial, type LgMeeting, type LifeGroup, type Person } from "@/lib/db-types";
import { formatLongDate, groupScheduleLabel } from "@/lib/portal-format";
import { formatDateTime, formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Laporan Life Group" };
export const dynamic = "force-dynamic";

type Attendee = Pick<Person, "id" | "full_name" | "nickname" | "life_group_id">;

/** Rata-rata kehadiran (anggota + tamu) dari pertemuan yang sudah dilaporkan. */
function averageAttendance(meetings: LgMeeting[]) {
  const reported = meetings.filter((meeting) => meeting.reported_at).slice(0, 8);
  if (!reported.length) return null;
  const total = reported.reduce((sum, meeting) => sum + meeting.attendee_ids.length + meeting.guest_count, 0);
  return { value: Math.round((total / reported.length) * 10) / 10, count: reported.length };
}

export default async function LifeGroupReportsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await adminDb();
  const [groupResult, meetingsResult] = await Promise.all([
    supabase.from(TABLES.lifeGroups).select("*").eq("id", id).maybeSingle(),
    supabase.from(TABLES.lgMeetings).select("*").eq("life_group_id", id).order("starts_at", { ascending: false }).limit(200),
  ]);

  const error = groupResult.error ?? meetingsResult.error;
  if (!groupResult.data && !error) notFound();
  const group = groupResult.data as LifeGroup | null;
  const meetings = (meetingsResult.data ?? []) as LgMeeting[];

  // Yang hadir bisa saja sudah pindah grup, jadi nama diambil per id, bukan dari anggota sekarang.
  const attendeeIds = [...new Set(meetings.flatMap((meeting) => meeting.attendee_ids))];
  const materialIds = [...new Set(meetings.map((meeting) => meeting.material_id).filter((value): value is string => Boolean(value)))];
  const [peopleResult, materialsResult] = await Promise.all([
    attendeeIds.length
      ? supabase.from(TABLES.people).select("id, full_name, nickname, life_group_id").in("id", attendeeIds)
      : Promise.resolve({ data: [] as Attendee[] }),
    materialIds.length
      ? supabase.from(TABLES.lgMaterials).select("id, title").in("id", materialIds)
      : Promise.resolve({ data: [] as Pick<LgMaterial, "id" | "title">[] }),
  ]);
  const people = new Map(((peopleResult.data ?? []) as Attendee[]).map((person) => [person.id, person]));
  const materials = new Map(((materialsResult.data ?? []) as Pick<LgMaterial, "id" | "title">[]).map((m) => [m.id, m.title]));

  const now = Date.now();
  const average = averageAttendance(meetings);
  const unreported = meetings.filter((meeting) => !meeting.reported_at && new Date(meeting.starts_at).getTime() < now).length;

  return (
    <>
      <AdminPageHeader
        title={group ? `Laporan ${group.name}` : "Laporan Life Group"}
        description={
          group
            ? [groupScheduleLabel(group), average ? `rata-rata ${average.value} orang hadir di ${average.count} pertemuan terakhir` : null]
                .filter(Boolean)
                .join(" · ") || undefined
            : undefined
        }
        backHref={`/admin/life-group/${id}`}
      />
      <DbError error={error} />

      {unreported > 0 && (
        <p className="mb-6 rounded-xl bg-sun-400/15 px-4 py-3 text-sm text-ink ring-1 ring-sun-500/40">
          {unreported} pertemuan yang sudah lewat belum dilaporkan leader.
        </p>
      )}

      {meetings.length ? (
        <ul className="space-y-3">
          {meetings.map((meeting) => {
            const past = new Date(meeting.starts_at).getTime() < now;
            const attendees = meeting.attendee_ids.map((attendee) => people.get(attendee)).filter(Boolean) as Attendee[];
            const total = meeting.attendee_ids.length + meeting.guest_count;
            return (
              <li key={meeting.id}>
                <Card className="p-4 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    {meeting.reported_at ? (
                      <Badge tone="green">Dilaporkan {formatDateTime(meeting.reported_at)}</Badge>
                    ) : past ? (
                      <Badge tone="sun">Belum dilaporkan</Badge>
                    ) : (
                      <Badge tone="navy">Akan datang</Badge>
                    )}
                    {meeting.material_id && materials.get(meeting.material_id) && (
                      <Link href={`/admin/materi/${meeting.material_id}`} className="text-xs font-semibold text-navy-700 hover:underline">
                        {materials.get(meeting.material_id)}
                      </Link>
                    )}
                  </div>
                  <h2 className="font-display mt-2.5 text-lg leading-snug font-bold text-ink">{formatLongDate(meeting.starts_at)}</h2>
                  <p className="mt-0.5 text-sm text-ink-soft">{[formatTime(meeting.starts_at), meeting.place].filter(Boolean).join(" · ")}</p>
                  {meeting.topic && <p className="mt-2 text-sm font-medium text-ink">{meeting.topic}</p>}

                  {meeting.reported_at && (
                    <div className="mt-4 grid gap-4 border-t border-ink/8 pt-4 lg:grid-cols-[18rem_1fr] lg:gap-8">
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {total} hadir
                          <span className="font-normal text-ink-soft">
                            {" "}
                            ({meeting.attendee_ids.length} anggota{meeting.guest_count ? `, ${meeting.guest_count} tamu` : ""})
                          </span>
                        </p>
                        {attendees.length > 0 && (
                          <ul className="mt-2.5 flex flex-wrap gap-1.5">
                            {attendees.map((person) => (
                              <li key={person.id}>
                                <Link
                                  href={`/admin/jemaat/${person.id}`}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-cream-100 py-1 pr-2.5 pl-1 text-xs font-medium text-ink transition hover:bg-navy-50"
                                >
                                  <PersonAvatar person={person} className="h-5 w-5 rounded-full text-[9px]" />
                                  {person.nickname || person.full_name}
                                  {person.life_group_id !== id && <span className="text-ink-soft">(sudah pindah)</span>}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="space-y-3 text-sm leading-relaxed text-ink">
                        {meeting.report && (
                          <div>
                            <h3 className="text-xs font-semibold text-ink-soft">Jalannya pertemuan</h3>
                            <p className="mt-1 whitespace-pre-wrap">{meeting.report}</p>
                          </div>
                        )}
                        {meeting.prayer_requests && (
                          <div>
                            <h3 className="text-xs font-semibold text-ink-soft">Pokok doa</h3>
                            <p className="mt-1 whitespace-pre-wrap">{meeting.prayer_requests}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      ) : (
        !error && (
          <EmptyState
            title="Belum ada pertemuan"
          />
        )
      )}
    </>
  );
}
