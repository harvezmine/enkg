import Image from "next/image";

import { ministries, type Ministry } from "@/content/ministries";
import { schedule, upcomingSchedule } from "@/content/schedule";
import { site } from "@/content/site";
import { formatJakartaDate, recurrenceLabel } from "@/lib/schedule";

import { Icon } from "../icons";
import { Reveal } from "../reveal";
import { Section, SectionHeading } from "../section";
import { Grain } from "../ui";

/** Tata letak bento per kartu (grid 6 kolom di layar ≥ md). */
const SPAN: Record<string, string> = {
  "sunday-service": "md:col-span-2",
  "kids-church": "md:col-span-4",
  "life-group": "md:col-span-3",
  prayer: "md:col-span-3",
  youth: "md:col-span-6",
};

function CtaLink({ href, label, className }: { href: string; label: string; className: string }) {
  const external = href.startsWith("http");
  return (
    <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={className}>
      {label}
      {external ? <Icon.arrowUpRight className="lift h-4 w-4" /> : <Icon.arrowRight className="shift h-4 w-4" />}
    </a>
  );
}

/** Kartu Ibadah Minggu: tanpa gambar, jadi jamnya yang dijadikan visual. */
function SundayServiceCard({ ministry }: { ministry: Ministry }) {
  const service = schedule.find((item) => item.id === "sunday-service")!;
  return (
    <article className="bg-navy-deep relative isolate flex h-full flex-col justify-between gap-10 overflow-hidden rounded-[1.75rem] p-7 text-cream-100 shadow-lift">
      <Grain className="opacity-10" />
      <div>
        <p className="text-sm font-semibold text-sun-400">{recurrenceLabel(service.recurrence)}</p>
        <h3 className="font-display mt-2 text-2xl font-bold">{ministry.name}</h3>
        <p className="mt-3 leading-relaxed text-cream-100/75">{ministry.summary}</p>
      </div>
      <div>
        <p className="font-display tabular text-7xl leading-none font-bold tracking-tight">
          {service.start.replace(":", ".")}
          <span className="ml-2 text-2xl text-sun-400">WIB</span>
        </p>
        <p className="mt-3 flex items-center gap-2 text-sm text-cream-100/75">
          <Icon.mapPin className="h-4 w-4 shrink-0 text-sun-400" />
          {site.address.venue} · Mahaka Square Lt. 2
        </p>
        <CtaLink href={ministry.cta.href} label={ministry.cta.label} className="btn btn-sun mt-6 px-5 py-3 text-sm" />
      </div>
    </article>
  );
}

function YouthCard({ ministry }: { ministry: Ministry }) {
  return (
    <article className="relative flex h-full flex-col gap-6 overflow-hidden rounded-[1.75rem] bg-sun-500 p-7 text-ink shadow-soft sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <span aria-hidden="true" className="font-display pointer-events-none absolute -right-4 -bottom-10 text-[9rem] leading-none font-bold text-ink/6">
        Youth
      </span>
      <div className="relative flex items-start gap-5">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ink text-sun-400">
          <Icon.users className="h-7 w-7" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink/65">{ministry.meta}</p>
          <h3 className="font-display text-2xl font-bold">{ministry.name}</h3>
          <p className="mt-1.5 max-w-xl leading-relaxed text-ink/75">{ministry.summary}</p>
        </div>
      </div>
      <CtaLink href={ministry.cta.href} label={ministry.cta.label} className="btn relative shrink-0 bg-ink text-cream-100 hover:bg-navy-950" />
    </article>
  );
}

function MinistryCard({ ministry }: { ministry: Ministry }) {
  if (ministry.id === "sunday-service") return <SundayServiceCard ministry={ministry} />;
  if (ministry.id === "youth") return <YouthCard ministry={ministry} />;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-cream-50 shadow-soft ring-1 ring-ink/5 transition duration-500 ease-out-soft hover:-translate-y-1 hover:shadow-lift">
      {ministry.image && (
        // Poster Canva berisi teks, jadi ditampilkan utuh (tanpa crop).
        <div className="overflow-hidden bg-navy-900">
          <Image
            src={ministry.image.src}
            alt={ministry.image.alt}
            width={ministry.image.width}
            height={ministry.image.height}
            sizes="(min-width: 1024px) 40rem, 100vw"
            className="h-auto w-full transition duration-700 ease-out-soft group-hover:scale-[1.03]"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-7">
        <p className="text-sm font-semibold text-navy-700">{ministry.meta}</p>
        <h3 className="font-display mt-1.5 text-2xl font-bold">{ministry.name}</h3>
        <p className="mt-3 flex-1 leading-relaxed text-ink-soft">{ministry.summary}</p>
        <CtaLink
          href={ministry.cta.href}
          label={ministry.cta.label}
          className="btn btn-outline mt-6 self-start px-5 py-2.5 text-sm"
        />
      </div>
    </article>
  );
}

export function Services({ now }: { now: Date }) {
  const upcoming = upcomingSchedule(now);
  // Kelompokkan per pola hari, urut sesuai definisi di content/schedule.ts.
  const groups = [...new Set(schedule.map((item) => recurrenceLabel(item.recurrence)))].map((label) => {
    const items = upcoming
      .filter((item) => recurrenceLabel(item.recurrence) === label)
      .sort((a, b) => a.start.localeCompare(b.start));
    return { label, next: items[0].next, items };
  });

  return (
    <Section id="pelayanan">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <SectionHeading
            eyebrow="Pelayanan"
            title="Ada tempat untukmu di sini."
            intro="Dari Ibadah Minggu sampai doa bersama di tengah minggu. Pilih langkah pertama yang paling pas buatmu dan keluargamu."
          />
        </div>
        <Reveal delay={100} className="lg:col-span-5 lg:pb-2">
          <p className="flex items-start gap-3 text-ink-soft lg:justify-end lg:text-right">
            <Icon.mapPin className="mt-0.5 h-5 w-5 shrink-0 text-navy-700 lg:order-last" />
            <span>
              <span className="font-semibold text-ink">{site.address.venue}</span>, {site.address.building}
              <br />
              Kids Church di {site.address.kidsRoom}
            </span>
          </p>
        </Reveal>
      </div>

      {/* Jadwal mingguan */}
      <Reveal delay={120} className="mt-14">
        <ol className="grid overflow-hidden rounded-[2rem] bg-cream-50 shadow-soft ring-1 ring-ink/5 lg:grid-cols-[1.45fr_1fr_1fr]">
          {groups.map((group) => (
            <li key={group.label} className="border-ink/10 p-7 not-last:border-b sm:p-8 lg:not-last:border-r lg:not-last:border-b-0">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-xl font-bold">{group.label}</h3>
                <p className="text-sm text-navy-700">{formatJakartaDate(group.next)}</p>
              </div>
              <ul className="mt-6 space-y-5">
                {group.items.map((item) => (
                  <li key={item.id} className="grid grid-cols-[5.5rem_1fr] gap-4">
                    <p className="font-display tabular text-3xl leading-none font-bold tracking-tight">
                      {item.start.replace(":", ".")}
                    </p>
                    <div className="min-w-0">
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-soft">
                        {item.mode === "online" ? (
                          <Icon.video className="h-4 w-4 text-navy-700" />
                        ) : (
                          <Icon.mapPin className="h-4 w-4 text-navy-700" />
                        )}
                        {item.place}
                        {item.end && ` · sampai ${item.end.replace(":", ".")}`}
                      </p>
                      {item.note && item.href && (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2.5 inline-flex flex-wrap items-center gap-x-2 rounded-xl bg-navy-50 px-3 py-2 text-sm text-navy-800 transition hover:bg-navy-100"
                        >
                          {item.note} <Icon.arrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Reveal>

      {/* Pelayanan */}
      <ul className="mt-6 grid gap-5 md:grid-cols-6">
        {ministries.map((ministry, index) => (
          <Reveal as="li" key={ministry.id} delay={index * 70} className={SPAN[ministry.id] ?? "md:col-span-3"}>
            <MinistryCard ministry={ministry} />
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
