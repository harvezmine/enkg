import type { Metadata } from "next";
import Link from "next/link";

import { deleteSchedule, importDefaultSchedule, toggleSchedule } from "@/app/actions/calendar";
import { DbError } from "@/components/admin/db-error";
import { DeleteButton } from "@/components/admin/delete-button";
import { AdminPageHeader, Badge, Card, EmptyState, Notice } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { adminDb } from "@/lib/admin-auth";
import {
  CATEGORY_LABEL,
  SLUG_USAGE,
  WEEKDAYS,
  WEEKDAYS_SHORT,
  dotClock,
  formatDateFull,
  lifeGroupRoutine,
  lifeGroupRoutineText,
  sortLifeGroups,
  todayInJakarta,
  toClock,
  weekdayOf,
} from "@/lib/calendar";
import { LIFE_GROUP_SEGMENT_LABEL, TABLES, type LifeGroup, type ScheduleCategory, type ScheduleRow } from "@/lib/db-types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Kalender" };
export const dynamic = "force-dynamic";

const CATEGORY_TONE: Record<ScheduleCategory, "navy" | "sun" | "green" | "gray"> = {
  ibadah: "navy",
  doa: "sun",
  life_group: "green",
  lainnya: "gray",
};

const byTime = (a: ScheduleRow, b: ScheduleRow) =>
  a.start_time.localeCompare(b.start_time) || a.sort_order - b.sort_order || a.title.localeCompare(b.title, "id");

function patternText(row: ScheduleRow) {
  const day = row.weekday !== null ? WEEKDAYS[row.weekday] : "";
  if (row.recurrence === "weekly") return `Setiap ${day}`;
  if (row.recurrence === "monthly_nth") return `${day} ke-${row.nth} setiap bulan`;
  return row.on_date ? formatDateFull(row.on_date) : "Tanggal belum diisi";
}

function ScheduleCard({ row, past }: { row: ScheduleRow; past?: boolean }) {
  const start = toClock(row.start_time);
  const end = toClock(row.end_time);
  const usage = row.slug ? SLUG_USAGE[row.slug] : undefined;

  return (
    <Card className={`p-4 sm:p-5 ${row.published ? "" : "bg-white/60"}`}>
      <div className="grid grid-cols-[4.25rem_1fr] gap-4 sm:grid-cols-[5rem_1fr]">
        <p className={`font-display tabular text-2xl leading-none font-bold tracking-tight sm:text-3xl ${row.published ? "text-ink" : "text-ink-soft"}`}>
          {start ? dotClock(start) : "--.--"}
        </p>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={CATEGORY_TONE[row.category]}>{CATEGORY_LABEL[row.category]}</Badge>
            {!row.published && <Badge tone="gray">Disembunyikan</Badge>}
            {past && <Badge tone="gray">Sudah lewat</Badge>}
          </div>
          <h3 className="font-display mt-2 text-lg leading-snug font-bold text-ink">{row.title}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <Icon.calendar className="h-4 w-4" />
              {patternText(row)}
              {end && ` · sampai ${dotClock(end)}`}
            </span>
            {row.place && (
              <span className="inline-flex items-center gap-1.5">
                {row.mode === "online" ? <Icon.video className="h-4 w-4" /> : <Icon.mapPin className="h-4 w-4" />}
                {row.place}
              </span>
            )}
          </p>
          {usage && <p className="mt-2 text-xs text-ink-soft">Dipakai juga: {usage.toLowerCase()}.</p>}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-ink/8 pt-3">
        <Link
          href={`/admin/kalender/${row.id}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-navy-50 px-3 text-xs font-semibold text-navy-700"
        >
          <Icon.edit className="h-4 w-4" /> Ubah
        </Link>
        <form action={toggleSchedule}>
          <input type="hidden" name="id" value={row.id} />
          <input type="hidden" name="next" value={row.published ? "false" : "true"} />
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold text-ink-soft transition hover:bg-cream-100"
          >
            {row.published ? "Sembunyikan" : "Tampilkan"}
          </button>
        </form>
        <span className="ml-auto">
          <DeleteButton action={deleteSchedule} id={row.id} />
        </span>
      </div>
    </Card>
  );
}

function Group({ title, description, rows, pastIds }: { title: string; description?: string; rows: ScheduleRow[]; pastIds?: Set<string> }) {
  if (!rows.length) return null;
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      <ul className="mt-4 grid gap-3 lg:grid-cols-2">
        {rows.map((row) => (
          <li key={row.id}>
            <ScheduleCard row={row} past={pastIds?.has(row.id)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

type CalendarGroup = Pick<LifeGroup, "id" | "name" | "segment" | "area" | "meeting_day" | "meeting_time" | "show_on_calendar">;

const DOT: Record<ScheduleCategory, string> = {
  ibadah: "bg-navy-700",
  doa: "bg-sun-500",
  life_group: "bg-[#7f9877]",
  lainnya: "bg-ink/35",
};

type WeekEntry = { key: string; start: string; title: string; category: ScheduleCategory; note?: string; href?: string };

/**
 * Sepekan sekilas: jadwal rutin gereja dan jadwal rutin tiap Life Group yang
 * tampil di kalender, per hari. Supaya pengurus langsung melihat hari yang
 * padat atau jam yang bertabrakan.
 */
function WeekOverview({ rows, groups, today }: { rows: ScheduleRow[]; groups: CalendarGroup[]; today: string }) {
  const days = WEEKDAYS.map((day, weekday) => {
    const entries: WeekEntry[] = [
      ...rows
        .filter((row) => row.published && row.recurrence !== "once" && row.weekday === weekday)
        .flatMap((row) => {
          const start = toClock(row.start_time);
          return start
            ? [{ key: row.id, start, title: row.title, category: row.category, note: row.recurrence === "monthly_nth" ? `minggu ke-${row.nth}` : undefined, href: `/admin/kalender/${row.id}` }]
            : [];
        }),
      ...groups
        .filter((group) => group.show_on_calendar)
        .flatMap((group) => {
          const routine = lifeGroupRoutine(group);
          return routine && routine.weekday === weekday
            ? [{ key: group.id, start: routine.start, title: group.name, category: "life_group" as const, href: `/admin/life-group/${group.id}` }]
            : [];
        }),
    ].sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title, "id"));
    return { day, weekday, entries };
  });
  if (!days.some((day) => day.entries.length)) return null;
  const todayWeekday = weekdayOf(today);

  return (
    <section className="mb-10">
      <h2 className="font-display text-xl font-bold text-ink">Sepekan sekilas</h2>
      <p className="mt-1 text-sm text-ink-soft">Jadwal rutin gereja dan Life Group yang tampil di kalender situs.</p>
      <ol className="mt-4 grid gap-px overflow-hidden rounded-2xl bg-ink/8 shadow-soft ring-1 ring-ink/8 sm:grid-cols-2 lg:grid-cols-7">
        {days.map(({ day, weekday, entries }) => (
          <li key={day} className={cn("min-w-0 bg-white p-3.5 lg:min-h-44", weekday === todayWeekday && "bg-sun-400/10")}>
            <p className={cn("flex items-center justify-between text-xs font-semibold", weekday === 0 ? "text-navy-700" : "text-ink-soft")}>
              <span className="lg:hidden">{day}</span>
              <span className="hidden lg:inline">{WEEKDAYS_SHORT[weekday]}</span>
              {weekday === todayWeekday && <span className="rounded-full bg-sun-500 px-2 py-0.5 text-[10px] font-bold text-ink">Hari ini</span>}
            </p>
            {entries.length ? (
              <ul className="mt-2.5 space-y-2">
                {entries.map((entry) => (
                  <li key={entry.key}>
                    <Link href={entry.href ?? "#"} className="group flex gap-2 rounded-lg text-xs leading-snug">
                      <span aria-hidden="true" className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", DOT[entry.category])} />
                      <span className="min-w-0">
                        <span className="tabular font-semibold text-ink">{dotClock(entry.start)}</span>{" "}
                        <span className="text-ink-soft group-hover:text-ink group-hover:underline">{entry.title}</span>
                        {entry.note && <span className="block text-[11px] text-ink-soft/70">{entry.note}</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2.5 text-xs text-ink-soft/50">Kosong</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Life Group dan statusnya di kalender publik. Diatur dari halaman Life Group masing-masing. */
function LifeGroupStatus({ groups }: { groups: CalendarGroup[] }) {
  if (!groups.length) return null;
  const shown = groups.filter((group) => group.show_on_calendar).length;

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-xl font-bold text-ink">Life Group</h2>
        <p className="text-sm text-ink-soft">
          {shown} dari {groups.length} grup tampil di kalender
        </p>
      </div>
      <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => {
          const routine = lifeGroupRoutine(group);
          return (
            <li key={group.id}>
              <Card className={cn("flex h-full items-start gap-3 p-4", !group.show_on_calendar && "bg-white/60")}>
                <span aria-hidden="true" className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", group.show_on_calendar ? DOT.life_group : "bg-ink/15")} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{group.name}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {[lifeGroupRoutineText(group), group.segment ? LIFE_GROUP_SEGMENT_LABEL[group.segment] : null, group.area]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {group.show_on_calendar ? <Badge tone="green">Tampil</Badge> : <Badge tone="gray">Tidak tampil</Badge>}
                    {group.show_on_calendar && !routine && <Badge tone="sun">Hanya pertemuan dari leader</Badge>}
                  </div>
                </div>
                <Link
                  href={`/admin/life-group/${group.id}?ubah=1`}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-navy-50 px-3 text-xs font-semibold text-navy-700"
                >
                  <Icon.edit className="h-4 w-4" /> Atur
                </Link>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default async function AdminCalendarPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const supabase = await adminDb();
  const [{ data, error }, lifeGroupResult] = await Promise.all([
    supabase.from(TABLES.schedule).select("*").order("sort_order").order("start_time"),
    supabase
      .from(TABLES.lifeGroups)
      .select("id, name, segment, area, meeting_day, meeting_time, show_on_calendar")
      .eq("is_active", true),
  ]);
  const rows = (data ?? []) as ScheduleRow[];
  // Tabel Life Group boleh belum ada; kalender tetap bisa diurus.
  const lifeGroups = sortLifeGroups((lifeGroupResult.data ?? []) as CalendarGroup[]);
  const today = todayInJakarta(new Date());

  const weekly = WEEKDAYS.map((day, weekday) => ({
    day,
    rows: rows.filter((row) => row.recurrence === "weekly" && row.weekday === weekday).sort(byTime),
  }));
  const monthly = rows
    .filter((row) => row.recurrence === "monthly_nth")
    .sort((a, b) => (a.weekday ?? 0) - (b.weekday ?? 0) || (a.nth ?? 0) - (b.nth ?? 0) || byTime(a, b));
  const once = rows.filter((row) => row.recurrence === "once");
  const upcomingOnce = once.filter((row) => (row.on_date ?? "") >= today).sort((a, b) => (a.on_date ?? "").localeCompare(b.on_date ?? "") || byTime(a, b));
  const pastOnce = once.filter((row) => (row.on_date ?? "") < today).sort((a, b) => (b.on_date ?? "").localeCompare(a.on_date ?? ""));

  const newButton = (
    <Link href="/admin/kalender/baru" className="btn btn-navy px-4 py-2.5 text-sm">
      <Icon.plus className="h-4 w-4" /> Jadwal baru
    </Link>
  );

  return (
    <>
      <AdminPageHeader
        title="Kalender"
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/#kalender" target="_blank" className="btn btn-outline px-4 py-2.5 text-sm">
              <Icon.eye className="h-4 w-4" /> Lihat di situs
            </Link>
            {newButton}
          </div>
        }
      />

      <DbError error={error} />

      <WeekOverview rows={rows} groups={lifeGroups} today={today} />

      {rows.length ? (
        <>
          {weekly.some((group) => group.rows.length) && (
            <section>
              <h2 className="font-display text-xl font-bold text-ink">Setiap minggu</h2>
              <div className="mt-4 space-y-6">
                {weekly
                  .filter((group) => group.rows.length)
                  .map((group) => (
                    <div key={group.day}>
                      <p className="mb-2.5 text-sm font-semibold text-navy-700">{group.day}</p>
                      <ul className="grid gap-3 lg:grid-cols-2">
                        {group.rows.map((row) => (
                          <li key={row.id}>
                            <ScheduleCard row={row} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </section>
          )}
          <Group title="Tiap bulan" rows={monthly} />
          <Group title="Sekali" description="Yang sudah lewat tidak tampil di situs." rows={upcomingOnce} />
          <Group title="Sudah lewat" rows={pastOnce} pastIds={new Set(pastOnce.map((row) => row.id))} />
        </>
      ) : (
        !error && (
          <EmptyState
            title="Belum ada jadwal di database"
            description="Situs memakai jadwal bawaan."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <form action={importDefaultSchedule}>
                  <button type="submit" className="btn btn-navy px-4 py-2.5 text-sm">
                    <Icon.check className="h-4 w-4" /> Salin jadwal bawaan
                  </button>
                </form>
                <Link href="/admin/kalender/baru" className="btn btn-outline px-4 py-2.5 text-sm">
                  <Icon.plus className="h-4 w-4" /> Jadwal baru
                </Link>
              </div>
            }
          />
        )
      )}

      <LifeGroupStatus groups={lifeGroups} />

      <Card className="mt-10 p-5 text-sm leading-relaxed text-ink-soft">
        <p className="font-semibold text-ink">Yang ikut tampil otomatis di kalender</p>
        <p className="mt-1">
          Event gereja yang sudah terbit (menu{" "}
          <Link href="/admin/event?kategori=gereja" className="font-semibold text-navy-700 hover:underline">
            Event & ProCon
          </Link>
          ) dan Life Group yang tampil di kalender (menu{" "}
          <Link href="/admin/life-group" className="font-semibold text-navy-700 hover:underline">
            Life Group
          </Link>
          ). Alamat rumah, topik, dan isi laporan pertemuan tidak pernah tampil di situs.
        </p>
      </Card>
    </>
  );
}
