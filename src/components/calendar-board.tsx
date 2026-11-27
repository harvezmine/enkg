"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  WEEKDAYS_SHORT,
  addDays,
  dotClock,
  formatDayLong,
  formatDayShort,
  formatMonth,
  monthGrid,
  monthOf,
  todayInJakarta,
  type CalendarCategory,
  type Occurrence,
} from "@/lib/calendar";
import { linkTarget } from "@/lib/images";
import { cn } from "@/lib/utils";

import { Icon } from "./icons";
import { Grain } from "./ui";

/** Warna kategori, semua dari palet situs: navy, sun, dan dua warna tanah dari kartu Kids Church. */
const DOT: Record<CalendarCategory, string> = {
  ibadah: "bg-navy-700",
  doa: "bg-sun-500",
  life_group: "bg-[#7f9877]",
  acara: "bg-[#c9825c]",
  lainnya: "bg-ink/35",
};
/** Di sel terpilih (latar navy), titik navy diganti krem supaya tetap terlihat. */
const DOT_ON_DARK: Partial<Record<CalendarCategory, string>> = { ibadah: "bg-cream-100", lainnya: "bg-cream-100/50" };

function categoriesOf(list: Occurrence[]) {
  return CATEGORY_ORDER.filter((category) => list.some((item) => item.category === category));
}

function AgendaItem({ item }: { item: Occurrence }) {
  return (
    <li className="grid grid-cols-[4.25rem_1fr] gap-3 sm:grid-cols-[4.75rem_1fr]">
      <time dateTime={item.startsAt} className="font-display tabular text-2xl leading-none font-bold tracking-tight sm:text-3xl">
        {dotClock(item.start)}
      </time>
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-xs font-semibold text-cream-100/60">
          <span aria-hidden="true" className={cn("h-2 w-2 shrink-0 rounded-full", DOT_ON_DARK[item.category] ?? DOT[item.category])} />
          {CATEGORY_LABEL[item.category]}
          {item.end && <span className="font-normal">· sampai {dotClock(item.end)}</span>}
        </p>
        <p className="mt-1 leading-snug font-semibold">{item.title}</p>
        {item.place && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-cream-100/70">
            {item.mode === "online" ? (
              <Icon.video className="h-4 w-4 shrink-0 text-sun-400" />
            ) : (
              <Icon.mapPin className="h-4 w-4 shrink-0 text-sun-400" />
            )}
            {item.place}
          </p>
        )}
        {item.note && <p className="mt-1 text-xs leading-relaxed text-cream-100/55">{item.note}</p>}
        {item.href && (
          <a
            href={item.href}
            {...(item.href.startsWith("#") ? {} : linkTarget(item.href))}
            className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-sun-400 underline-offset-4 hover:underline"
          >
            {item.hrefLabel ?? "Selengkapnya"}
            {item.href.startsWith("http") ? <Icon.arrowUpRight className="h-3.5 w-3.5" /> : <Icon.arrowRight className="h-3.5 w-3.5" />}
          </a>
        )}
      </div>
    </li>
  );
}

/**
 * Life Group di hari terpilih, ringkas: jam, nama, wilayah. Satu ajakan daftar
 * di bawahnya, bukan satu tautan per grup, karena di hari ramai bisa ada
 * banyak grup sekaligus.
 */
function LifeGroupAgenda({ items, compactTop }: { items: Occurrence[]; compactTop: boolean }) {
  return (
    <div className={cn(compactTop ? "mt-7" : "mt-8 border-t border-white/10 pt-6")}>
      <p className="flex items-center gap-2 text-xs font-semibold text-cream-100/60">
        <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", DOT.life_group)} />
        Life Group{items.length > 1 ? ` · ${items.length} grup` : ""}
      </p>
      <ul className="mt-3 divide-y divide-white/8">
        {items.map((item) => (
          <li key={item.key} className="grid grid-cols-[4.25rem_1fr] items-baseline gap-3 py-2.5 sm:grid-cols-[4.75rem_1fr]">
            <time dateTime={item.startsAt} className="font-display tabular text-xl leading-none font-bold tracking-tight">
              {dotClock(item.start)}
            </time>
            <div className="min-w-0">
              <p className="leading-snug font-semibold">{item.title}</p>
              {item.place && (
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-cream-100/70">
                  <Icon.mapPin className="h-3.5 w-3.5 shrink-0 text-sun-400" />
                  {item.place}
                </p>
              )}
              {item.note && <p className="mt-1 text-xs leading-relaxed text-sun-300/90">{item.note}</p>}
            </div>
          </li>
        ))}
      </ul>
      <a
        href={items.length === 1 && items[0]!.href ? items[0]!.href : "#gabung-life-group"}
        className="mt-3 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-sun-400 underline-offset-4 hover:underline"
      >
        Mau ikut? Daftar dulu <Icon.arrowRight className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

/**
 * Kalender bulanan + agenda hari terpilih. Datanya dihitung di server untuk
 * beberapa bulan sekaligus, jadi berpindah bulan tidak perlu memuat apa pun.
 */
export function CalendarBoard({
  months,
  today: serverToday,
  occurrences,
}: {
  months: string[];
  today: string;
  occurrences: Occurrence[];
}) {
  // Halaman di-cache sampai satu jam: "hari ini" dihitung ulang di browser.
  const [today, setToday] = useState(serverToday);
  const [monthIndex, setMonthIndex] = useState(0);
  const [selected, setSelected] = useState(serverToday);
  const agendaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const now = todayInJakarta(new Date());
    if (now !== serverToday) {
      setToday(now);
      setSelected(now);
    }
  }, [serverToday]);

  const byDate = useMemo(() => {
    const map = new Map<string, Occurrence[]>();
    for (const item of occurrences) map.set(item.date, [...(map.get(item.date) ?? []), item]);
    return map;
  }, [occurrences]);

  const month = months[monthIndex] ?? months[0]!;
  const weeks = useMemo(() => monthGrid(month), [month]);
  const dayItems = byDate.get(selected) ?? [];
  const churchItems = dayItems.filter((item) => item.kind !== "life_group");
  const lifeGroupItems = dayItems.filter((item) => item.kind === "life_group");
  const upcoming = occurrences.filter((item) => item.date > selected).slice(0, 3);
  const legend = categoriesOf(occurrences);

  const goToMonth = (index: number) => {
    const target = months[index];
    if (!target) return;
    setMonthIndex(index);
    if (monthOf(selected) === target) return;
    // Pindah bulan: pilih hari ini kalau ada di bulan itu, kalau tidak hari pertama yang ada jadwalnya.
    const firstWithItems = occurrences.find((item) => monthOf(item.date) === target && item.date >= today)?.date;
    setSelected(monthOf(today) === target ? today : (firstWithItems ?? `${target}-01`));
  };

  const select = (date: string, reveal = false) => {
    setSelected(date);
    const index = months.indexOf(monthOf(date));
    if (index >= 0 && index !== monthIndex) setMonthIndex(index);
    // Di HP agenda ada di bawah kalender: geser sedikit supaya isinya kelihatan.
    const agenda = agendaRef.current;
    if (reveal && agenda && window.matchMedia("(max-width: 1023px)").matches) {
      const { top } = agenda.getBoundingClientRect();
      if (top > window.innerHeight - 160) {
        const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollBy({ top: top - window.innerHeight * 0.35, behavior: smooth ? "smooth" : "auto" });
      }
    }
  };

  const relative = selected === today ? "Hari ini" : selected === addDays(today, 1) ? "Besok" : null;
  const kicker = relative ?? (dayItems.length ? `${dayItems.length} jadwal` : null);

  return (
    <div className="grid gap-5 lg:grid-cols-12 lg:items-start">
      {/* ── Bulan ─────────────────────────────────────────────────────────── */}
      <div className="rounded-[2rem] bg-paper p-3 shadow-lit-soft ring-1 ring-ink/5 sm:p-6 lg:col-span-7">
        <div className="flex items-center justify-between gap-3 px-2 pt-2 pb-4 sm:px-1 sm:pt-0">
          <h3 className="font-display text-2xl font-bold tracking-tight sm:text-3xl" aria-live="polite">
            {formatMonth(month)}
          </h3>
          <div className="flex items-center gap-1.5">
            {(monthOf(selected) !== monthOf(today) || selected !== today) && (
              <button
                type="button"
                onClick={() => select(today)}
                className="hidden h-10 items-center rounded-full px-3.5 text-sm font-semibold text-navy-700 transition hover:bg-cream-200/60 sm:inline-flex"
              >
                Hari ini
              </button>
            )}
            <button
              type="button"
              onClick={() => goToMonth(monthIndex - 1)}
              disabled={monthIndex === 0}
              aria-label="Bulan sebelumnya"
              className="grid h-11 w-11 place-items-center rounded-full border border-ink/12 text-ink transition hover:border-navy-700 hover:text-navy-700 disabled:pointer-events-none disabled:opacity-30"
            >
              <Icon.arrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goToMonth(monthIndex + 1)}
              disabled={monthIndex === months.length - 1}
              aria-label="Bulan berikutnya"
              className="grid h-11 w-11 place-items-center rounded-full border border-ink/12 text-ink transition hover:border-navy-700 hover:text-navy-700 disabled:pointer-events-none disabled:opacity-30"
            >
              <Icon.arrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {WEEKDAYS_SHORT.map((day, index) => (
            <p
              key={day}
              className={cn(
                "pb-2 text-center text-xs font-semibold",
                index === 0 ? "text-navy-700" : "text-ink-soft/70",
              )}
            >
              {day}
            </p>
          ))}

          {weeks.flat().map((date, index) => {
            if (!date) return <span key={`blank-${index}`} aria-hidden="true" />;
            const items = byDate.get(date) ?? [];
            const categories = categoriesOf(items);
            const isSelected = date === selected;
            const isToday = date === today;
            const isPast = date < today;
            const isSunday = index % 7 === 0;

            return (
              <button
                key={date}
                type="button"
                onClick={() => select(date, true)}
                aria-pressed={isSelected}
                aria-label={`${formatDayLong(date)}${isToday ? ", hari ini" : ""}: ${items.length ? `${items.length} jadwal` : "tidak ada jadwal"}`}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center rounded-xl transition duration-200 sm:aspect-[1/0.86] sm:rounded-2xl",
                  isSelected
                    ? "bg-navy-700 text-cream-100 shadow-soft"
                    : isSunday
                      ? "bg-navy-50/80 text-navy-900 hover:bg-navy-100"
                      : "text-ink hover:bg-cream-200/60",
                  isPast && !isSelected && "opacity-45",
                  isToday && !isSelected && "ring-2 ring-sun-500 ring-inset",
                )}
              >
                <span className="font-display tabular text-[0.9375rem] leading-none font-semibold sm:text-lg">{Number(date.slice(8))}</span>
                <span aria-hidden="true" className="mt-1.5 flex h-1.5 gap-[3px]">
                  {categories.map((category) => (
                    <span
                      key={category}
                      className={cn("h-1.5 w-1.5 rounded-full", isSelected ? (DOT_ON_DARK[category] ?? DOT[category]) : DOT[category])}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-2 pb-1 sm:px-1">
          {legend.length > 0 && (
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-soft" aria-label="Keterangan warna">
              {legend.map((category) => (
                <li key={category} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", DOT[category])} />
                  {CATEGORY_LABEL[category]}
                </li>
              ))}
            </ul>
          )}
          {selected !== today && (
            <button
              type="button"
              onClick={() => select(today)}
              className="inline-flex min-h-9 items-center text-xs font-semibold text-navy-700 underline-offset-4 hover:underline sm:hidden"
            >
              Kembali ke hari ini
            </button>
          )}
        </div>
      </div>

      {/* ── Agenda hari terpilih ─────────────────────────────────────────── */}
      <div
        ref={agendaRef}
        className="bg-navy-deep relative isolate overflow-hidden rounded-[2rem] p-6 text-cream-100 shadow-lit sm:p-8 lg:col-span-5"
      >
        <Grain className="opacity-10" />
        <div key={selected} className="animate-fade relative">
          {kicker && <p className="mb-1.5 text-sm font-semibold text-sun-400">{kicker}</p>}
          <h3 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{formatDayLong(selected)}</h3>

          {dayItems.length ? (
            <>
              {churchItems.length > 0 && (
                <ul className="mt-7 space-y-6">
                  {churchItems.map((item) => (
                    <AgendaItem key={item.key} item={item} />
                  ))}
                </ul>
              )}
              {lifeGroupItems.length > 0 && <LifeGroupAgenda items={lifeGroupItems} compactTop={!churchItems.length} />}
            </>
          ) : (
            <div className="mt-6">
              <p className="leading-relaxed text-cream-100/70">Belum ada jadwal di hari ini.</p>
              {upcoming[0] && (
                <button
                  type="button"
                  onClick={() => select(upcoming[0]!.date)}
                  className="btn btn-light mt-5 px-5 py-2.5 text-sm"
                >
                  Lihat {formatDayLong(upcoming[0].date)} <Icon.arrowRight className="shift h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {dayItems.length > 0 && upcoming.length > 0 && (
            <div className="mt-8 border-t border-white/10 pt-5">
              <p className="text-xs font-semibold text-cream-100/50">Setelah itu</p>
              <ul className="mt-2 divide-y divide-white/8">
                {upcoming.map((item) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => select(item.date)}
                      className="group flex w-full items-baseline gap-3 py-2.5 text-left text-sm"
                    >
                      <span aria-hidden="true" className={cn("h-2 w-2 shrink-0 translate-y-[-1px] rounded-full", DOT_ON_DARK[item.category] ?? DOT[item.category])} />
                      <span className="tabular w-[5.5rem] shrink-0 text-cream-100/60">{formatDayShort(item.date)}</span>
                      <span className="min-w-0 flex-1 truncate font-medium group-hover:text-sun-300">
                        {dotClock(item.start)} · {item.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
