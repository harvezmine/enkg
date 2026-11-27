import { ministries, type Ministry } from "@/content/ministries";
import { schedule as staticSchedule } from "@/content/schedule";
import { site } from "@/content/site";
import { WEEKDAYS, dotClock, recurringBySlug, type CalendarItem, type RecurringItem } from "@/lib/calendar";
import { recurrenceLabel } from "@/lib/schedule";

import { Icon } from "../icons";
import { Reveal } from "../reveal";
import { Section, SectionHeading } from "../section";
import { Grain } from "../ui";

/**
 * Tiga pelayanan utama (Ibadah Minggu, Kids Church, Youth) mendapat blok besar
 * dengan perlakuan sendiri-sendiri, bukan satu cangkang kartu yang diulang lima
 * kali. Doa dan Life Group jadi pasangan kartu yang lebih tenang di bawahnya,
 * karena Life Group sudah punya section sendiri di atas.
 */

function Cta({ ministry, className }: { ministry: Ministry; className: string }) {
  const external = ministry.cta.href.startsWith("http");
  return (
    <a
      href={ministry.cta.href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={className}
    >
      {ministry.cta.label}
      {external ? <Icon.arrowUpRight className="lift h-4 w-4" /> : <Icon.arrowRight className="shift h-4 w-4" />}
    </a>
  );
}

/** "Minggu · 10.30 WIB" dari jadwal, supaya ikut berubah saat jam diubah di admin. */
function dayAndTime(item: RecurringItem) {
  const day = item.recurrence.kind === "weekly" ? WEEKDAYS[item.recurrence.weekday] : recurrenceLabel(item.recurrence);
  return `${day} · ${dotClock(item.start)} WIB`;
}

/** Jam di panel kartu diambil dari kalender (admin), teks lainnya dari content/ministries.ts. */
type Times = {
  service: RecurringItem;
  prayer: RecurringItem | null;
  kids: RecurringItem | null;
  heritage: RecurringItem | null;
  wednesday: RecurringItem | null;
  friday: RecurringItem | null;
};

/** Ibadah Minggu: jangkar gelap, jamnya jadi elemen terbesar di seluruh section. */
function SundayService({ ministry, times }: { ministry: Ministry; times: Times }) {
  const service = times.service;
  const panel = ministry.panel;
  return (
    <article className="bg-navy-deep relative isolate flex flex-col justify-between gap-10 overflow-hidden rounded-[2rem] p-8 text-cream-100 shadow-lit sm:p-10 lg:flex-row lg:items-end lg:p-12">
      <Grain className="opacity-10" />
      <span
        aria-hidden="true"
        className="animate-breathe pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-navy-500/30 blur-3xl"
      />
      <div className="relative max-w-xl">
        <p className="text-sm font-semibold text-sun-400">{recurrenceLabel(service.recurrence)}</p>
        <h3 className="font-display mt-3 text-3xl font-bold sm:text-4xl">{ministry.name}</h3>
        <p className="mt-4 leading-relaxed text-cream-100/75">{ministry.summary}</p>
        <p className="mt-6 flex items-center gap-2 text-sm text-cream-100/75">
          <Icon.mapPin className="h-4 w-4 shrink-0 text-sun-400" />
          {site.address.venue} · {site.address.building}
        </p>
        <Cta ministry={ministry} className="btn btn-sun mt-8" />
      </div>
      {panel.kind === "time" && (
        <p className="font-display tabular relative text-[5.5rem] leading-[0.85] font-bold tracking-tighter sm:text-[7rem] lg:text-right lg:text-[8.5rem]">
          {dotClock(service.start)}
          <span className="mt-2 block text-base font-semibold tracking-normal text-sun-400 sm:text-lg">
            {panel.unit} · {times.prayer ? `Doa bersama ${dotClock(times.prayer.start)}` : panel.note}
          </span>
        </p>
      )}
    </article>
  );
}

/** Kids Church: bentuk-bentuk lengkung bertumpuk, satu-satunya grafis bermain di situs. */
function KidsChurch({ ministry, time }: { ministry: Ministry; time: RecurringItem | null }) {
  const panel = ministry.panel;
  const shapes = [
    { h: "h-16", c: "bg-[#c9825c]" },
    { h: "h-28", c: "bg-[#e0a94f]" },
    { h: "h-20", c: "bg-[#7f9877]" },
    { h: "h-32", c: "bg-[#b4643f]" },
    { h: "h-14", c: "bg-[#d9b06b]" },
  ];
  return (
    <article className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] bg-[#f0e5d5] p-8 text-[#5d3b26] shadow-lit-soft ring-1 ring-ink/5 sm:p-9">
      <div className="relative">
        <p className="text-sm font-semibold text-[#9a6340]">{time ? dayAndTime(time) : ministry.meta}</p>
        <h3 className="font-display mt-3 text-3xl font-bold sm:text-4xl">{ministry.name}</h3>
        {panel.kind === "time" && (
          <p className="font-display tabular mt-6 text-6xl leading-none font-bold tracking-tight sm:text-7xl">
            {time ? dotClock(time.start) : panel.figure}
            <span className="ml-2 align-baseline text-xl font-semibold opacity-70">{panel.unit}</span>
          </p>
        )}
        <p className="mt-5 max-w-sm leading-relaxed text-[#5d3b26]/80">{ministry.summary}</p>
      </div>
      <div className="relative mt-10">
        <Cta ministry={ministry} className="btn border border-[#5d3b26]/20 text-sm hover:border-[#5d3b26]/60" />
      </div>
      {/* Deretan lengkung di dasar kartu, naik berurutan saat kartu disentuh. */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-4 -bottom-2 flex items-end gap-2">
        {shapes.map((shape, index) => (
          <span
            key={index}
            className={`block w-10 rounded-t-full transition-transform duration-500 ease-out-soft group-hover:-translate-y-3 sm:w-12 ${shape.h} ${shape.c}`}
            style={{ transitionDelay: `${index * 60}ms`, opacity: 0.55 }}
          />
        ))}
      </div>
    </article>
  );
}

/**
 * Heritage: umurnya persis di antara Kids dan Youth, dan kartunya pun berdiri di
 * antara keduanya, satu-satunya berlatar sun penuh. Jamnya sama dengan Kids
 * Church, jadi yang dibesarkan rentang umurnya, bukan jamnya lagi.
 */
function Heritage({ ministry, time }: { ministry: Ministry; time: RecurringItem | null }) {
  const panel = ministry.panel;
  return (
    <article className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] bg-sun-500 p-8 text-ink shadow-lit-soft sm:p-9">
      {/* Tiga anak panah naik di sudut, kepotong tepi kartu. Kids memakai lengkung
          dan Youth memakai lingkaran, jadi Heritage sengaja bersudut: tiga bentuk
          yang tidak mungkin tertukar meski ketiganya berjajar. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 120 120"
        className="pointer-events-none absolute -right-7 -bottom-7 h-40 w-40 text-ink/15 sm:h-44 sm:w-44"
      >
        {[0, 1, 2].map((step) => (
          <polyline
            key={step}
            points={`14,${58 + step * 26} 60,${20 + step * 26} 106,${58 + step * 26}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-500 ease-out-soft group-hover:-translate-y-2"
            style={{ transitionDelay: `${step * 70}ms` }}
          />
        ))}
      </svg>

      <div className="relative">
        <p className="text-sm font-semibold text-ink/65">{time ? dayAndTime(time) : ministry.meta}</p>
        <h3 className="font-display mt-3 text-3xl font-bold sm:text-4xl">{ministry.name}</h3>
        {panel.kind === "age" && (
          <p className="font-display tabular mt-6 text-6xl leading-none font-bold tracking-tight sm:text-7xl">
            {panel.figure}
            <span className="ml-2 align-baseline text-xl font-semibold tracking-normal opacity-60">{panel.unit}</span>
          </p>
        )}
        <p className="mt-5 max-w-sm leading-relaxed text-ink/75">{ministry.summary}</p>
        <p className="mt-4 flex items-start gap-2 text-sm font-semibold text-ink/75">
          <Icon.mapPin className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
          {site.address.office}, {site.address.officeNote}
        </p>
      </div>
      <div className="relative mt-8">
        <Cta ministry={ministry} className="btn bg-ink text-sm text-sun-400 hover:bg-navy-950" />
      </div>
    </article>
  );
}

/** Youth: paling berenergi, memakai busur sun besar sebagai grafisnya. */
function Youth({ ministry }: { ministry: Ministry }) {
  const panel = ministry.panel;
  return (
    <article className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] bg-navy-950 p-8 text-cream-100 shadow-lit sm:p-9">
      <Grain className="opacity-8" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 -bottom-28 h-80 w-80 rounded-full border-[18px] border-sun-500/25 transition-transform duration-700 ease-out-soft group-hover:scale-110"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -bottom-12 h-44 w-44 rounded-full border-[10px] border-sun-400/20"
      />
      <div className="relative">
        <p className="text-sm font-semibold text-sun-400">{ministry.meta}</p>
        <h3 className="font-display mt-3 text-3xl font-bold sm:text-4xl">{ministry.name}</h3>
        {panel.kind === "list" && (
          <ul className="mt-6 space-y-1">
            {panel.lines.map((line) => (
              <li key={line} className="font-display text-3xl leading-tight font-bold tracking-tight text-sun-300 sm:text-4xl">
                {line}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-5 max-w-sm leading-relaxed text-cream-100/75">{ministry.summary}</p>
      </div>
      <div className="relative mt-10">
        <Cta ministry={ministry} className="btn btn-sun text-sm" />
      </div>
    </article>
  );
}

/** Doa & Life Group: pasangan kartu tenang. */
function QuietCard({ ministry, tone, meta }: { ministry: Ministry; tone: "prayer" | "life-group"; meta?: string }) {
  const panel = ministry.panel;
  return (
    <article
      className={`group flex h-full flex-col justify-between gap-8 rounded-[2rem] p-7 shadow-lit-soft ring-1 ring-ink/5 transition duration-500 ease-out-soft hover:-translate-y-1 hover:shadow-lift sm:p-8 ${
        tone === "prayer" ? "bg-[#e3e9f1] text-navy-900" : "bg-cream-50 text-ink"
      }`}
    >
      <div>
        <p className="text-sm font-semibold text-navy-700">{meta ?? ministry.meta}</p>
        <h3 className="font-display mt-2 text-2xl font-bold">{ministry.name}</h3>
        {panel.kind === "verse" && (
          <blockquote className="mt-5 border-l-2 border-navy-700/30 pl-4">
            <p className="font-serif text-lg leading-snug italic">&ldquo;{panel.text}&rdquo;</p>
            <footer className="mt-2 text-xs text-navy-700">{panel.source}</footer>
          </blockquote>
        )}
        {panel.kind === "list" && (
          <ul className="mt-5 space-y-0.5">
            {panel.lines.map((line) => (
              <li key={line} className="font-display text-xl leading-tight font-bold tracking-tight text-navy-700">
                {line}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-5 leading-relaxed text-ink-soft">{ministry.summary}</p>
      </div>
      <Cta ministry={ministry} className="btn btn-outline self-start px-5 py-2.5 text-sm" />
    </article>
  );
}

/** Hal-hal yang paling sering ditanya tamu baru. Hanya fakta yang sudah pasti. */
function firstVisit(times: Times) {
  const kids = times.kids ? `Kids Church ${dotClock(times.kids.start)} di ${times.kids.place}.` : "Ada Kids Church untuk anak.";
  return [
    {
      icon: Icon.clock,
      label: "Kapan",
      body: `Minggu ${dotClock(times.service.start)} WIB.${times.prayer ? ` Doa bersama mulai ${dotClock(times.prayer.start)}.` : ""}`,
    },
    { icon: Icon.mapPin, label: "Di mana", body: `${site.address.venue}, ${site.address.building}.` },
    { icon: Icon.check, label: "Pakai apa", body: "Pakai yang membuatmu nyaman. Tidak ada aturan." },
    { icon: Icon.users, label: "Bawa anak", body: `${kids} Usia 12–17 ke Heritage.` },
  ] as const;
}

/** "Rabu 20.00 via Zoom · Jumat ke-4 onsite", dari jadwal doa yang sedang berlaku. */
function prayerMeta(times: Times) {
  const parts = [
    times.wednesday && times.wednesday.recurrence.kind === "weekly"
      ? `${WEEKDAYS[times.wednesday.recurrence.weekday]} ${dotClock(times.wednesday.start)}${times.wednesday.mode === "online" ? " via Zoom" : ""}`
      : null,
    times.friday && times.friday.recurrence.kind === "monthly-nth"
      ? `${WEEKDAYS[times.friday.recurrence.weekday]} ke-${times.friday.recurrence.nth} ${times.friday.mode === "online" ? "online" : "onsite"}`
      : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : undefined;
}

/** `items`: jadwal dari kalender admin (atau jadwal bawaan). Jadwal lengkapnya ada di section Kalender. */
export function Services({ items }: { items: CalendarItem[] }) {
  const byId = (id: string) => ministries.find((m) => m.id === id)!;
  const pick = (slug: string) => recurringBySlug(items, slug, staticSchedule);
  // Hanya Ibadah Minggu yang selalu jatuh ke jadwal bawaan; yang lain boleh tidak ada.
  const fromItems = (slug: string) => {
    const found = items.find((item) => item.slug === slug);
    return found && found.recurrence.kind !== "once" ? (found as RecurringItem) : null;
  };
  const times: Times = {
    service: pick("sunday-service")!,
    prayer: fromItems("sunday-prayer"),
    kids: fromItems("kids-church"),
    heritage: fromItems("heritage"),
    wednesday: fromItems("wednesday-prayer"),
    friday: fromItems("friday-prayer"),
  };

  return (
    <Section id="pelayanan">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <SectionHeading
            eyebrow="Pelayanan"
            title="Ada tempat untukmu di sini."
            intro="Ibadah Minggu, Kids Church, Heritage, Youth, doa bersama, dan Life Group. Semuanya terbuka untuk tamu."
          />
        </div>
        <Reveal delay={100} className="lg:col-span-5 lg:pb-2">
          <p className="flex items-start gap-3 text-ink-soft lg:justify-end lg:text-right">
            <Icon.mapPin className="mt-0.5 h-5 w-5 shrink-0 text-navy-700 lg:order-last" />
            <span>
              <span className="font-semibold text-ink">{site.address.venue}</span>, {site.address.building}
            </span>
          </p>
        </Reveal>
      </div>

      {/* Pita untuk tamu baru, supaya pertanyaan pertama terjawab sebelum ditanya. */}
      <Reveal delay={100} className="mt-12 sm:mt-14">
        <ul className="grid gap-x-8 gap-y-7 border-y border-ink/15 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {firstVisit(times).map(({ icon: ItemIcon, label, body }) => (
            <li key={label} className="flex items-start gap-3.5">
              <ItemIcon className="mt-0.5 h-5 w-5 shrink-0 text-navy-700" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>

      {/* Tiga pelayanan utama. */}
      {/* Kids, Heritage, Youth berdampingan dan urut umur, jadi orang tua langsung
          tahu anaknya masuk yang mana tanpa harus membaca ketiganya. */}
      <div className="mt-12 grid gap-5 sm:mt-14 md:grid-cols-2 lg:grid-cols-3">
        <Reveal className="md:col-span-2 lg:col-span-3">
          <SundayService ministry={byId("sunday-service")} times={times} />
        </Reveal>
        <Reveal delay={60}>
          <KidsChurch ministry={byId("kids-church")} time={times.kids} />
        </Reveal>
        <Reveal delay={120}>
          <Heritage ministry={byId("heritage")} time={times.heritage} />
        </Reveal>
        <Reveal delay={180} className="md:col-span-2 lg:col-span-1">
          <Youth ministry={byId("youth")} />
        </Reveal>
      </div>

      {/* Doa & Life Group. */}
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Reveal>
          <QuietCard ministry={byId("prayer")} tone="prayer" meta={prayerMeta(times)} />
        </Reveal>
        <Reveal delay={60}>
          <QuietCard ministry={byId("life-group")} tone="life-group" />
        </Reveal>
      </div>
    </Section>
  );
}
