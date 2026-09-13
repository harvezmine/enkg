import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { cache } from "react";

import { ArticleShell } from "@/components/article-shell";
import { Icon } from "@/components/icons";
import { RichText } from "@/components/rich-text";
import { site, whatsappUrl } from "@/content/site";
import { canOptimizeImage } from "@/lib/images";
import { getEventBySlug, summarize } from "@/lib/queries";
import { formatDate, formatTime, isoDateWib } from "@/lib/utils";

// Dirender saat pertama dibuka lalu disimpan; admin panel memperbaruinya lewat revalidatePath.
export const revalidate = 3600;
export async function generateStaticParams() {
  return [];
}

const loadEvent = cache(getEventBySlug);

type Props = { params: Promise<{ slug: string }> };

/** Tanggal dan jam dalam WIB, termasuk event yang berlangsung lebih dari sehari. */
function when(startsAt: string | null, endsAt: string | null) {
  if (!startsAt) return null;
  const multiDay = endsAt && isoDateWib(endsAt) !== isoDateWib(startsAt);
  return {
    date: multiDay ? `${formatDate(startsAt)} sampai ${formatDate(endsAt)}` : formatDate(startsAt),
    time: endsAt && !multiDay ? `${formatTime(startsAt).replace(/ WIB$/, "")} sampai ${formatTime(endsAt)}` : formatTime(startsAt),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await loadEvent((await params).slug);
  if (!event) return { title: "Event tidak ditemukan" };

  const schedule = when(event.starts_at, event.ends_at);
  const description =
    summarize(event.description, 160) ||
    [schedule ? `${schedule.date}, ${schedule.time}` : "Segera hadir", event.location].filter(Boolean).join(" · ");
  const url = `/event/${event.slug}`;
  return {
    title: event.title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title: event.title, description, images: event.cover_url ? [event.cover_url] : undefined },
  };
}

function InfoRow({ icon: RowIcon, label, children }: { icon: ComponentType<{ className?: string }>; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy-50 text-navy-700">
        <RowIcon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold tracking-wide text-ink-soft uppercase">{label}</dt>
        <dd className="mt-0.5 font-semibold text-ink">{children}</dd>
      </div>
    </div>
  );
}

export default async function EventDetailPage({ params }: Props) {
  const event = await loadEvent((await params).slug);
  if (!event) notFound();

  const schedule = when(event.starts_at, event.ends_at);
  const past = event.starts_at ? new Date(event.ends_at ?? event.starts_at).getTime() < Date.now() : false;
  const isProcon = event.category === "procon";

  const jsonLd = event.starts_at && {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.starts_at,
    endDate: event.ends_at ?? undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    description: summarize(event.description, 300) || undefined,
    image: event.cover_url ? [event.cover_url] : undefined,
    location: event.location ? { "@type": "Place", name: event.location, address: event.address ?? event.location } : undefined,
    organizer: { "@type": "Organization", name: site.name, url: site.url },
    url: `${site.url}/event/${event.slug}`,
  };

  return (
    <ArticleShell backHref={isProcon ? "/#procon" : "/#news"}>
      <article className="px-5 pt-12 pb-20 sm:px-8 sm:pt-16 lg:pb-28">
        <div className="mx-auto max-w-6xl">
          <header className="max-w-3xl">
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <span className={`rounded-md px-2 py-0.5 font-semibold ${isProcon ? "bg-sun-500 text-ink" : "bg-navy-700 text-cream-100"}`}>
                {isProcon ? "ProCon" : "Event"}
              </span>
              {event.topic && <span className="rounded-md bg-ink/6 px-2 py-0.5 font-medium text-ink">{event.topic}</span>}
              {past && <span className="rounded-md bg-ink/6 px-2 py-0.5 text-ink-soft">Telah berlangsung</span>}
            </p>
            <h1 className="text-headline mt-4 font-bold text-balance">{event.title}</h1>
            {event.partner && <p className="mt-3 text-lg font-semibold text-navy-700">Bersama {event.partner}</p>}
          </header>

          <div className="mt-10 grid gap-10 sm:mt-12 lg:grid-cols-12 lg:gap-14">
            <div className="min-w-0 lg:col-span-8">
              {event.cover_url && (
                <div className="relative aspect-1200/630 overflow-hidden rounded-[1.75rem] bg-navy-900 shadow-lift">
                  <Image
                    src={event.cover_url}
                    alt={event.title}
                    fill
                    priority
                    sizes="(min-width: 1024px) 44rem, 100vw"
                    unoptimized={!canOptimizeImage(event.cover_url)}
                    className="object-cover"
                  />
                </div>
              )}
              {event.description ? (
                <RichText content={event.description} className={event.cover_url ? "mt-10" : ""} />
              ) : (
                <p className={`text-lead text-ink-soft ${event.cover_url ? "mt-10" : ""}`}>
                  Detail acara segera diumumkan. Tanyakan info terbaru lewat WhatsApp.
                </p>
              )}
            </div>

            <aside className="lg:col-span-4">
              <div className="rounded-[1.75rem] bg-paper p-6 shadow-soft ring-1 ring-ink/5 sm:p-7 lg:sticky lg:top-24">
                <dl className="space-y-5">
                  {schedule ? (
                    <>
                      <InfoRow icon={Icon.calendar} label="Tanggal">
                        {schedule.date}
                      </InfoRow>
                      <InfoRow icon={Icon.clock} label="Waktu">
                        {schedule.time}
                      </InfoRow>
                    </>
                  ) : (
                    <InfoRow icon={Icon.calendar} label="Jadwal">
                      Segera hadir
                    </InfoRow>
                  )}
                  {event.location && (
                    <InfoRow icon={Icon.mapPin} label="Tempat">
                      {event.location}
                      {event.address && <span className="mt-1 block text-sm font-normal text-ink-soft">{event.address}</span>}
                    </InfoRow>
                  )}
                </dl>

                <div className="mt-7 flex flex-col gap-3">
                  {event.register_url && !past && (
                    <a href={event.register_url} target="_blank" rel="noopener noreferrer" className="btn btn-navy w-full">
                      Daftar sekarang <Icon.arrowUpRight className="h-4 w-4" />
                    </a>
                  )}
                  {event.map_url && (
                    <a href={event.map_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full">
                      <Icon.mapPin className="h-5 w-5" /> Buka peta
                    </a>
                  )}
                  <a
                    href={whatsappUrl(`Halo Every Nation Kelapa Gading, saya ingin bertanya tentang ${event.title}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-wa w-full"
                  >
                    <Icon.whatsapp className="h-5 w-5" /> Tanya lewat WhatsApp
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}
    </ArticleShell>
  );
}
