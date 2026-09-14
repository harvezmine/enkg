import { procon, type ProconEvent } from "@/content/procon";
import { whatsappMessages, whatsappUrl } from "@/content/site";
import { linkTarget } from "@/lib/images";

import { Icon } from "../icons";
import { Reveal } from "../reveal";
import { Eyebrow, Grain } from "../ui";

function formatIsoDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

/** Tombol kartu: detail di situs, link pendaftaran, atau WhatsApp bila belum ada keduanya. */
function cardAction(event: ProconEvent) {
  if (!event.href)
    return {
      href: whatsappUrl(`${whatsappMessages.procon} (${event.title})`),
      label: "Kabari saya",
    };
  return {
    href: event.href,
    label: event.href.startsWith("/") ? "Lihat detail" : "Daftar",
  };
}

/** Huruf besar samar di kartu utama: "AI" untuk event AI, selain itu huruf awal topiknya. */
function watermark(event: ProconEvent) {
  return /\bAI\b/.test(event.title) ? "AI" : event.topic.charAt(0).toUpperCase();
}

/** `events`: ProCon dari admin panel (atau placeholder statis bila kosong). */
export function Procon({ events }: { events: ProconEvent[] }) {
  const shown = events.slice(0, 5);
  // Kartu utama setinggi dua baris hanya bila sisa kartunya genap, supaya kisi tetap rapi.
  const spanFeatured = shown.length % 2 === 1;

  return (
    <section
      id="procon"
      className="relative isolate overflow-hidden bg-navy-950 px-5 pt-24 pb-28 text-cream-100 sm:px-8 lg:pt-32 lg:pb-36"
    >
      <Grain className="opacity-8" />
      {/* Kisi tipis ala kertas grafik, memudar ke tepi */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-8 [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:4.5rem_4.5rem] [mask-image:radial-gradient(ellipse_at_75%_20%,black,transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="animate-breathe pointer-events-none absolute -top-40 right-[-8%] -z-10 h-[32rem] w-[32rem] rounded-full bg-sun-500/15 blur-3xl"
      />

      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-12">
          <Reveal className="lg:col-span-7">
            <Eyebrow tone="navy">ProCon News</Eyebrow>
            <h2 className="text-headline mt-5 font-semibold">
              Iman dalam <span className="font-serif font-normal tracking-normal text-sun-300 italic">keseharian.</span>
            </h2>
          </Reveal>
          <Reveal delay={100} className="lg:col-span-5">
            <p className="text-lead text-cream-100/70">{procon.intro}</p>
            <ul className="mt-6 flex flex-wrap gap-2.5 text-sm">
              {[procon.tagline, procon.when, procon.format].map((item) => (
                <li key={item} className="rounded-full bg-white/6 px-4 py-2 text-cream-100/85 ring-1 ring-white/10">
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <ul className="mt-14 grid gap-5 lg:grid-cols-2">
          {shown.map((event, index) => {
            const featured = index === 0;
            const action = cardAction(event);
            return (
              <Reveal
                as="li"
                key={event.id}
                delay={index * 90}
                className={featured && spanFeatured && shown.length > 1 ? "lg:row-span-2" : ""}
              >
                <article
                  className={`group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] p-7 transition duration-300 sm:p-9 ${
                    featured
                      ? "min-h-[22rem] bg-sun-500 text-ink shadow-[0_30px_80px_-30px_rgb(252_188_4/0.45)]"
                      : "bg-white/4 ring-1 ring-white/10 hover:bg-white/7"
                  }`}
                >
                  {featured && (
                    <span
                      aria-hidden="true"
                      className="font-display pointer-events-none absolute top-20 -right-4 text-[20rem] leading-none font-bold tracking-tighter text-ink/10"
                    >
                      {watermark(event)}
                    </span>
                  )}
                  <div className="relative flex flex-wrap items-center justify-between gap-3 text-sm">
                    <span
                      className={`rounded-full px-3 py-1 font-semibold ${featured ? "bg-ink text-sun-400" : "bg-white/10 text-cream-100"}`}
                    >
                      {event.topic}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 ${featured ? "text-ink/70" : "text-cream-100/60"}`}
                    >
                      <Icon.calendar className="h-4 w-4" />
                      {event.date ? formatIsoDate(event.date) : "Segera hadir"}
                    </span>
                  </div>

                  <div className="relative mt-auto pt-10 sm:pt-14">
                    <h3
                      className={`font-display font-bold tracking-tight text-balance ${
                        featured ? "text-5xl sm:text-6xl" : "text-2xl sm:text-3xl"
                      }`}
                    >
                      {event.title}
                    </h3>
                    {event.partner && (
                      <p className={`mt-2 font-semibold ${featured ? "text-ink" : "text-sun-400"}`}>{event.partner}</p>
                    )}
                    {event.summary && (
                      <p className={`mt-3 max-w-md leading-relaxed ${featured ? "text-ink/75" : "text-cream-100/65"}`}>
                        {event.summary}
                      </p>
                    )}
                    <a
                      href={action.href}
                      {...linkTarget(action.href)}
                      className={`mt-6 inline-flex items-center gap-2 font-semibold ${featured ? "text-ink" : "text-cream-100"}`}
                    >
                      <span className="link-sweep">{action.label}</span>
                      <Icon.arrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </ul>

        <Reveal className="mt-8 flex flex-col gap-5 rounded-3xl bg-white/4 p-6 ring-1 ring-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <p className="max-w-xl text-cream-100/75">
            Jadwal lengkap dan pendaftaran ProCon segera tersedia di situs {procon.partnerSite.name}. Sementara itu,
            tanya jadwal terdekat lewat WhatsApp.
          </p>
          <a
            href={whatsappUrl(whatsappMessages.procon)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sun shrink-0"
          >
            <Icon.whatsapp className="h-5 w-5" /> Tanya jadwal ProCon
          </a>
        </Reveal>
      </div>
    </section>
  );
}
