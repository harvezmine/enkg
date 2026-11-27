import type { CalendarWindow } from "@/lib/calendar-data";
import {
  WEEKDAYS,
  dotClock,
  formatDayLong,
  joinAnchor,
  lgTitle,
  lifeGroupRoutine,
  rhythmGroups,
  todayInJakarta,
  type CalendarItem,
  type PublicLifeGroup,
} from "@/lib/calendar";
import { LIFE_GROUP_SEGMENT_LABEL } from "@/lib/db-types";

import { CalendarBoard } from "../calendar-board";
import { Icon } from "../icons";
import { Reveal } from "../reveal";
import { Section, SectionHeading } from "../section";

/**
 * Jadwal rutin: jawaban cepat untuk "hari apa saja ada ibadah?". Tampilannya
 * meneruskan blok "Jadwal lengkap" lama dari section Pelayanan: kolom Minggu
 * paling lebar karena isinya paling banyak.
 */
function Rhythm({ items, now }: { items: CalendarItem[]; now: Date }) {
  const groups = rhythmGroups(items, now);
  const today = todayInJakarta(now);
  if (!groups.length) return null;
  const wideFirst = groups.length > 2;

  return (
    <Reveal delay={100} className="mt-16 sm:mt-20">
      <h3 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Jadwal rutin</h3>
      <p className="mt-2 max-w-xl text-ink-soft">Tidak perlu daftar. Datang saja di jamnya.</p>
      <ol className="mt-6 grid gap-px overflow-hidden rounded-[2rem] bg-ink/10 shadow-lit-soft ring-1 ring-ink/5 md:grid-cols-2 xl:grid-cols-[1.75fr_1fr_1fr]">
        {groups.map((group, index) => {
          const nextDate = todayInJakarta(group.next);
          return (
            <li key={group.label} className={`bg-cream-50 p-6 sm:p-8 ${index === 0 && wideFirst ? "md:col-span-2 xl:col-span-1" : ""}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h4 className="font-display text-xl font-bold">{group.label}</h4>
                <p className="text-sm text-navy-700">{nextDate === today ? "Hari ini" : formatDayLong(nextDate)}</p>
              </div>
              <ul className={`mt-6 grid gap-5 ${index === 0 && wideFirst ? "sm:grid-cols-2 xl:grid-cols-1" : ""}`}>
                {group.items.map((item) => (
                  <li key={item.id} className="grid grid-cols-[4.5rem_1fr] gap-3">
                    <p className="font-display tabular text-2xl leading-none font-bold tracking-tight sm:text-3xl">{dotClock(item.start)}</p>
                    <div className="min-w-0">
                      <p className="font-semibold">{item.title}</p>
                      {(item.place || item.end) && (
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-soft">
                          {item.mode === "online" ? (
                            <Icon.video className="h-4 w-4 shrink-0 text-navy-700" />
                          ) : (
                            <Icon.mapPin className="h-4 w-4 shrink-0 text-navy-700" />
                          )}
                          {item.place}
                          {item.end && ` · sampai ${dotClock(item.end)}`}
                        </p>
                      )}
                      {item.href && (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-navy-700 underline-offset-4 hover:underline"
                        >
                          {item.mode === "online" ? "Buka Zoom" : "Buka tautan"} <Icon.arrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {item.note && <p className="mt-0.5 text-xs text-ink-soft">{item.note}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </Reveal>
  );
}

/**
 * Daftar Life Group yang dibuka di kalender: hari, jam, wilayah, dan ajakan
 * daftar. Tempat pertemuan (sering rumah anggota) sengaja tidak ada; leader
 * yang memberi tahu setelah pendaftar dihubungi.
 */
function LifeGroups({ groups }: { groups: PublicLifeGroup[] }) {
  if (!groups.length) return null;

  return (
    <Reveal delay={100} className="mt-16 sm:mt-20">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <h3 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Life Group di sekitarmu</h3>
          <p className="mt-3 leading-relaxed text-ink-soft">
            Kelompok kecil yang ketemu di luar hari Minggu, tiap grup di hari dan wilayahnya sendiri. Daftar dulu, nanti leader-nya yang
            menyapa kamu dan kasih tahu tempatnya.
          </p>
          <a href="#gabung-life-group" className="btn btn-navy mt-6">
            Gabung Life Group <Icon.arrowRight className="shift h-4 w-4" />
          </a>
        </div>

        <ul className="grid gap-px self-start overflow-hidden rounded-[2rem] bg-ink/10 shadow-lit-soft ring-1 ring-ink/5 sm:grid-cols-2 lg:col-span-8">
          {groups.map((group) => {
            const routine = lifeGroupRoutine(group);
            return (
              <li key={group.id} className="bg-cream-50">
                <a
                  href={joinAnchor(group.segment)}
                  className="group grid h-full grid-cols-[4.75rem_1fr] gap-4 p-5 transition-colors hover:bg-white sm:p-6"
                  aria-label={`Daftar ${lgTitle(group.name)}`}
                >
                  <div>
                    <p className="text-xs font-semibold text-navy-700">{routine ? WEEKDAYS[routine.weekday] : "Jadwal"}</p>
                    <p className="font-display tabular mt-1 text-2xl leading-none font-bold tracking-tight">
                      {routine ? dotClock(routine.start) : "Fleksibel"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="leading-snug font-semibold">{group.name}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-soft">
                      {group.segment && <span>{LIFE_GROUP_SEGMENT_LABEL[group.segment]}</span>}
                      {group.segment && group.area && <span aria-hidden="true">·</span>}
                      {group.area && (
                        <span className="inline-flex items-center gap-1">
                          <Icon.mapPin className="h-3.5 w-3.5 shrink-0 text-navy-700" />
                          {group.area}
                        </span>
                      )}
                    </p>
                    <p className="mt-2.5 inline-flex items-center gap-1 text-sm font-semibold text-navy-700">
                      Daftar <Icon.arrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </p>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </Reveal>
  );
}

/**
 * Kalender gereja: bulan berjalan dan dua bulan berikutnya, jadwal rutin di
 * bawahnya, lalu daftar Life Group. Isinya diatur pengurus lewat
 * /admin/kalender dan halaman Life Group, ditambah event gereja yang terbit.
 */
export function CalendarSection({ now, items, calendar }: { now: Date; items: CalendarItem[]; calendar: CalendarWindow }) {
  return (
    <Section id="kalender" tone="light">
      <SectionHeading
        eyebrow="Kalender"
        title="Hari-hari kita bersama."
        intro="Ibadah, doa bersama, Life Group, dan acara gereja dalam satu kalender. Pilih tanggalnya untuk lihat jam dan tempatnya."
      />

      <Reveal delay={100} className="mt-12 sm:mt-14">
        <CalendarBoard months={calendar.months} today={calendar.today} occurrences={calendar.occurrences} />
      </Reveal>

      <Rhythm items={items} now={now} />
      {/* Grup yang belum punya hari & jam tetap disembunyikan dulu dari daftar. */}
      <LifeGroups groups={calendar.lifeGroups.filter((group) => group.meeting_day !== null && Boolean(group.meeting_time))} />
    </Section>
  );
}
