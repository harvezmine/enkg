import { ministries, type Ministry } from "@/content/ministries";
import { schedule, upcomingSchedule } from "@/content/schedule";
import { site } from "@/content/site";
import { formatJakartaDate, recurrenceLabel } from "@/lib/schedule";

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

/** Ibadah Minggu: jangkar gelap, jamnya jadi elemen terbesar di seluruh section. */
function SundayService({ ministry }: { ministry: Ministry }) {
  const service = schedule.find((item) => item.id === "sunday-service")!;
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
          {panel.figure}
          <span className="mt-2 block text-base font-semibold tracking-normal text-sun-400 sm:text-lg">
            {panel.unit} · {panel.note}
          </span>
        </p>
      )}
    </article>
  );
}

/** Kids Church: bentuk-bentuk lengkung bertumpuk, satu-satunya grafis bermain di situs. */
function KidsChurch({ ministry }: { ministry: Ministry }) {
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
        <p className="text-sm font-semibold text-[#9a6340]">{ministry.meta}</p>
        <h3 className="font-display mt-3 text-3xl font-bold sm:text-4xl">{ministry.name}</h3>
        {panel.kind === "time" && (
          <p className="font-display tabular mt-6 text-6xl leading-none font-bold tracking-tight sm:text-7xl">
            {panel.figure}
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
function Heritage({ ministry }: { ministry: Ministry }) {
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
        <p className="text-sm font-semibold text-ink/65">{ministry.meta}</p>
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
function QuietCard({ ministry, tone }: { ministry: Ministry; tone: "prayer" | "life-group" }) {
  const panel = ministry.panel;
  return (
    <article
      className={`group flex h-full flex-col justify-between gap-8 rounded-[2rem] p-7 shadow-lit-soft ring-1 ring-ink/5 transition duration-500 ease-out-soft hover:-translate-y-1 hover:shadow-lift sm:p-8 ${
        tone === "prayer" ? "bg-[#e3e9f1] text-navy-900" : "bg-cream-50 text-ink"
      }`}
    >
      <div>
        <p className="text-sm font-semibold text-navy-700">{ministry.meta}</p>
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
const firstVisit = [
  { icon: Icon.clock, label: "Kapan", body: "Minggu 10.00 WIB. Doa bersama mulai 09.15." },
  { icon: Icon.mapPin, label: "Di mana", body: `${site.address.venue}, ${site.address.building}.` },
  { icon: Icon.check, label: "Pakai apa", body: "Pakai yang membuatmu nyaman. Tidak ada aturan." },
  { icon: Icon.users, label: "Bawa anak", body: `Kids Church 10.30 di ${site.address.kidsRoom}. Usia 12–17 ke Heritage.` },
] as const;

export function Services({ now }: { now: Date }) {
  const upcoming = upcomingSchedule(now);
  const byId = (id: string) => ministries.find((m) => m.id === id)!;
  // Kelompokkan per pola hari, urut sesuai definisi di content/schedule.ts.
  const groups = [...new Set(schedule.map((item) => recurrenceLabel(item.recurrence)))].map((label) => {
    const items = upcoming
      .filter((item) => recurrenceLabel(item.recurrence) === label)
      .sort((a, b) => a.start.localeCompare(b.start));
    return { label, next: items[0].next, items };
  });

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
          {firstVisit.map(({ icon: ItemIcon, label, body }) => (
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
          <SundayService ministry={byId("sunday-service")} />
        </Reveal>
        <Reveal delay={60}>
          <KidsChurch ministry={byId("kids-church")} />
        </Reveal>
        <Reveal delay={120}>
          <Heritage ministry={byId("heritage")} />
        </Reveal>
        <Reveal delay={180} className="md:col-span-2 lg:col-span-1">
          <Youth ministry={byId("youth")} />
        </Reveal>
      </div>

      {/* Doa & Life Group. */}
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Reveal>
          <QuietCard ministry={byId("prayer")} tone="prayer" />
        </Reveal>
        <Reveal delay={60}>
          <QuietCard ministry={byId("life-group")} tone="life-group" />
        </Reveal>
      </div>
      {/* Jadwal lengkap: kolom Minggu paling lebar karena isinya tiga kegiatan. */}
      <Reveal delay={100} className="mt-5">
        <ol className="grid gap-px overflow-hidden rounded-[2rem] bg-ink/10 shadow-lit-soft ring-1 ring-ink/5 md:grid-cols-2 xl:grid-cols-[1.75fr_1fr_1fr]">
          {groups.map((group, index) => (
            <li
              key={group.label}
              className={`bg-cream-50 p-6 sm:p-8 ${index === 0 ? "md:col-span-2 xl:col-span-1" : ""}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="font-display text-xl font-bold">{group.label}</h3>
                <p className="text-sm text-navy-700">{formatJakartaDate(group.next)}</p>
              </div>
              <ul className={`mt-6 grid gap-5 ${index === 0 ? "sm:grid-cols-2 xl:grid-cols-1" : ""}`}>
                {group.items.map((item) => (
                  <li key={item.id} className="grid grid-cols-[4.5rem_1fr] gap-3">
                    <p className="font-display tabular text-2xl leading-none font-bold tracking-tight sm:text-3xl">
                      {item.start.replace(":", ".")}
                    </p>
                    <div className="min-w-0">
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-soft">
                        {item.mode === "online" ? (
                          <Icon.video className="h-4 w-4 shrink-0 text-navy-700" />
                        ) : (
                          <Icon.mapPin className="h-4 w-4 shrink-0 text-navy-700" />
                        )}
                        {item.place}
                        {item.end && ` · sampai ${item.end.replace(":", ".")}`}
                      </p>
                      {item.href && (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-navy-700 underline-offset-4 hover:underline"
                        >
                          Buka Zoom <Icon.arrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {item.note && <p className="mt-0.5 text-xs text-ink-soft">{item.note}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Reveal>

    </Section>
  );
}
