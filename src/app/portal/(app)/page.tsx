import type { Metadata } from "next";
import Link from "next/link";

import { PersonAvatar } from "@/components/admin/people/avatar";
import { Card, EmptyState, Notice } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { TABLES, type LgMeeting } from "@/lib/db-types";
import { groupMembers, requireLeader } from "@/lib/leader-auth";
import { signPhotos } from "@/lib/people-data";
import { birthdayPhrase, formatDayMonth, todayWib, upcomingBirthdays } from "@/lib/people";
import { missingEssentials } from "@/lib/person-fields";
import { formatLongDate, groupScheduleLabel } from "@/lib/portal-format";
import { formatTime } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Beranda" };
export const dynamic = "force-dynamic";

type MeetingRow = Pick<LgMeeting, "id" | "starts_at" | "place" | "topic" | "reported_at">;

export default async function PortalHome({ searchParams }: { searchParams: Promise<{ password?: string }> }) {
  const { password } = await searchParams;
  const context = await requireLeader();
  const { lifeGroup, person, supabase } = context;
  const now = new Date().toISOString();
  const today = todayWib();

  const [{ members }, upcoming, unreported] = await Promise.all([
    groupMembers(context),
    supabase
      .from(TABLES.lgMeetings)
      .select("id, starts_at, place, topic, reported_at")
      .eq("life_group_id", lifeGroup.id)
      .gte("starts_at", now)
      .order("starts_at")
      .limit(1),
    supabase
      .from(TABLES.lgMeetings)
      .select("id, starts_at, place, topic, reported_at")
      .eq("life_group_id", lifeGroup.id)
      .lt("starts_at", now)
      .is("reported_at", null)
      .order("starts_at", { ascending: false })
      .limit(5),
  ]);

  const next = ((upcoming.data ?? []) as MeetingRow[])[0];
  const pending = (unreported.data ?? []) as MeetingRow[];
  const newcomers = members.filter((member) => member.status === "baru");
  const birthdays = upcomingBirthdays(members, today, 30);
  const photos = await signPhotos(supabase, [...newcomers, ...birthdays.map((item) => item.person)].map((m) => m.photo_path));
  const schedule = groupScheduleLabel(lifeGroup);

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Halo, {person.nickname || person.full_name.split(" ")[0]}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          {[lifeGroup.name, schedule, lifeGroup.area].filter(Boolean).join(" · ")}
        </p>
      </div>

      {password && (
        <div className="mb-6">
          <Notice tone="success">Password baru tersimpan.</Notice>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-ink">Pertemuan berikutnya</h2>
          {next ? (
            <Link href={`/portal/pertemuan/${next.id}`} className="group mt-3 block rounded-xl bg-navy-50 p-4 transition hover:bg-navy-100">
              <p className="font-display text-lg font-bold text-navy-800">{formatLongDate(next.starts_at)}</p>
              <p className="mt-0.5 text-sm text-navy-800/80">
                {[formatTime(next.starts_at), next.place].filter(Boolean).join(" · ")}
              </p>
              {next.topic && <p className="mt-2 text-sm font-medium text-ink">{next.topic}</p>}
            </Link>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">Belum ada jadwal pertemuan berikutnya.</p>
          )}
          <Link href="/portal/pertemuan/baru" className="btn btn-outline mt-4 px-4 py-2.5 text-sm">
            <Icon.plus className="h-4 w-4" /> Jadwalkan pertemuan
          </Link>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-ink">Laporan yang belum diisi</h2>
          {pending.length ? (
            <ul className="mt-3 space-y-2">
              {pending.map((meeting) => (
                <li key={meeting.id}>
                  <Link
                    href={`/portal/pertemuan/${meeting.id}#laporan`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-sun-400/15 px-4 py-3 ring-1 ring-sun-500/40 transition hover:bg-sun-400/25"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">{formatLongDate(meeting.starts_at)}</span>
                      {meeting.topic && <span className="block truncate text-xs text-ink-soft">{meeting.topic}</span>}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-navy-700">Isi laporan</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">Semua pertemuan sudah dilaporkan. Terima kasih!</p>
          )}
        </Card>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-xl font-bold text-ink">Jemaat baru di grup kamu</h2>
          <Link href="/portal/anggota" className="shrink-0 text-sm font-semibold text-navy-700">
            Semua anggota
          </Link>
        </div>
        {newcomers.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {newcomers.map((member) => (
              <li key={member.id}>
                <Card className="flex items-center gap-3 p-3.5">
                  <PersonAvatar
                    person={member}
                    photoUrl={member.photo_path ? photos.get(member.photo_path) : null}
                    className="h-12 w-12 shrink-0 rounded-full text-sm"
                  />
                  <Link href={`/portal/anggota/${member.id}/ubah`} className="group min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink group-hover:underline">{member.full_name}</span>
                    <span className="block truncate text-xs text-ink-soft">
                      {missingEssentials(member).length
                        ? `Belum ada ${missingEssentials(member).join(", ")}`
                        : (member.area ?? "Baru bergabung")}
                    </span>
                  </Link>
                  {member.phone && (
                    <a
                      href={whatsappLink(
                        member.phone,
                        `Halo ${member.nickname || member.full_name.split(" ")[0]}, aku ${person.nickname || person.full_name.split(" ")[0]} dari Life Group ${lifeGroup.name}. Senang kamu bergabung!`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                    >
                      <Icon.whatsapp className="h-4 w-4" /> Sapa
                    </a>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl bg-white/60 px-5 py-4 text-sm text-ink-soft">
            Belum ada jemaat baru.
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display mb-3 text-xl font-bold text-ink">Ulang tahun 30 hari ke depan</h2>
        {birthdays.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {birthdays.map(({ person: member, daysUntil, turning }) => (
              <li key={member.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-hair ring-1 ring-ink/[0.07]">
                <PersonAvatar
                  person={member}
                  photoUrl={member.photo_path ? photos.get(member.photo_path) : null}
                  className="h-10 w-10 shrink-0 rounded-full text-xs"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{member.full_name}</span>
                  <span className="block text-xs text-ink-soft">
                    {formatDayMonth(member.birth_date!)} · ke-{turning}
                  </span>
                </span>
                <span
                  className={
                    daysUntil <= 1
                      ? "shrink-0 rounded-full bg-sun-500 px-2.5 py-1 text-[11px] font-bold text-ink"
                      : "shrink-0 text-xs font-semibold text-ink-soft"
                  }
                >
                  {birthdayPhrase(daysUntil)}
                </span>
                {member.phone && daysUntil <= 7 && (
                  <a
                    href={whatsappLink(
                      member.phone,
                      `Selamat ulang tahun, ${member.nickname || member.full_name.split(" ")[0]}! Tuhan memberkati dan menyertai kamu di tahun yang baru ini.`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Kirim ucapan ulang tahun ke ${member.full_name}`}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                  >
                    <Icon.whatsapp className="h-4 w-4" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Belum ada yang berulang tahun" />
        )}
      </section>
    </>
  );
}
