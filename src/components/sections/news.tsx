import Image from "next/image";

import { NEWS_LABEL, type NewsItem } from "@/content/news";
import { schedule } from "@/content/schedule";
import { sermons } from "@/content/sermons";
import { site } from "@/content/site";
import { canOptimizeImage, linkTarget } from "@/lib/images";
import { nextOccurrence } from "@/lib/schedule";

import { Icon } from "../icons";
import { LiteYouTube } from "../lite-youtube";
import { Reveal } from "../reveal";
import { Section, SectionHeading } from "../section";

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

/** "2026-08-30" → "30 Agustus 2026" */
function formatIsoDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

function NewsMeta({ item, past }: { item: NewsItem; past: boolean }) {
  return (
    <p className="flex flex-wrap items-center gap-2 text-sm">
      <span className="rounded-md bg-navy-700 px-2 py-0.5 font-semibold text-cream-100">{NEWS_LABEL[item.type]}</span>
      <span className="text-ink-soft">{formatIsoDate(item.date)}</span>
      {past && item.type === "event" && (
        <span className="rounded-md bg-ink/6 px-2 py-0.5 text-ink-soft">Telah berlangsung</span>
      )}
    </p>
  );
}

function NewsCard({ item, past, featured }: { item: NewsItem; past: boolean; featured: boolean }) {
  const body = (
    <>
      {item.image && (
        <div className={`relative shrink-0 overflow-hidden bg-navy-900 ${featured ? "aspect-4/3 sm:aspect-auto sm:w-[46%]" : "aspect-square w-28 rounded-2xl sm:w-36"}`}>
          <Image
            src={item.image.src}
            alt={item.image.alt}
            fill
            sizes={featured ? "(min-width: 1024px) 22rem, 100vw" : "9rem"}
            unoptimized={!canOptimizeImage(item.image.src)}
            className="object-cover transition duration-700 ease-out-soft group-hover:scale-[1.04]"
          />
        </div>
      )}
      <div className={`flex min-w-0 flex-1 flex-col ${featured ? "p-7 sm:p-8" : ""}`}>
        <NewsMeta item={item} past={past} />
        <h4 className={`font-display mt-3 leading-snug font-bold ${featured ? "text-3xl" : "text-xl"}`}>{item.title}</h4>
        <p className={`mt-2 leading-relaxed text-ink-soft ${featured ? "" : "line-clamp-2 text-[0.9375rem]"}`}>
          {item.summary}
        </p>
        {item.href && (
          <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-navy-700">
            <span className="link-sweep">Selengkapnya</span> <Icon.arrowUpRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </>
  );

  const className = featured
    ? "group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-paper shadow-soft ring-1 ring-ink/5 transition duration-500 hover:shadow-lift sm:flex-row"
    : "group flex h-full items-start gap-5 rounded-[1.5rem] p-4 transition duration-300 hover:bg-paper";

  return item.href ? (
    <a href={item.href} {...linkTarget(item.href)} className={className}>
      {body}
    </a>
  ) : (
    <article className={className}>{body}</article>
  );
}

/** `items`: kabar, artikel, dan event dari admin panel (atau konten statis bila kosong). */
export function News({ now, items }: { now: Date; items: NewsItem[] }) {
  const today = new Date(now.getTime() + JAKARTA_OFFSET_MS).toISOString().slice(0, 10);

  // Event rutin terdekat ikut tampil sebagai kabar, tanggalnya selalu terkini.
  const friday = schedule.find((item) => item.id === "friday-prayer")!;
  const fridayDate = new Date(nextOccurrence(friday.recurrence, friday.start, now).getTime() + JAKARTA_OFFSET_MS);
  const upcomingPrayer: NewsItem = {
    id: "next-onsite-prayer",
    type: "event",
    title: "Onsite Prayer Meeting",
    date: fridayDate.toISOString().slice(0, 10),
    summary: "Berdoa bersama setiap Jumat ke-4, pukul 18.00 sampai 20.00 WIB di Stream Hall, Mahaka Square Lt. 2 Unit A30-32.",
    image: {
      src: "/images/ministries/prayer-friday.png",
      alt: "Poster Onsite Prayer Meeting setiap Jumat ke-4 pukul 18.00 sampai 20.00 di Stream Hall",
      width: 1080,
      height: 1080,
    },
  };

  const [featuredItem, ...restItems] = [upcomingPrayer, ...items].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const mosaic = sermons.slice(0, 6);
  const latest = sermons.slice(0, 4);

  return (
    <Section id="news" tone="light">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          eyebrow="News"
          title="Apa yang sedang terjadi di ENKG."
          intro="Rekaman khotbah setiap minggu, kabar jemaat, dan event terdekat."
        />
        <Reveal delay={100}>
          <a href={site.socials.youtube} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            <Icon.youtube className="h-5 w-5" /> Channel YouTube
          </a>
        </Reveal>
      </div>

      <div className="mt-12 grid gap-10 sm:mt-14 lg:grid-cols-12 lg:gap-8">
        <Reveal variant="scale" className="lg:col-span-7">
          <LiteYouTube src={site.youtube.latestEmbed} title="Rekaman ibadah terbaru Every Nation Kelapa Gading">
            <span className="absolute inset-0 grid grid-cols-3 grid-rows-2">
              {mosaic.map((sermon) => (
                <span key={sermon.id} className="relative">
                  <Image src={sermon.thumbnail} alt="" fill sizes="16rem" className="object-cover grayscale" />
                </span>
              ))}
            </span>
            <span className="absolute inset-0 bg-navy-900/80 mix-blend-multiply" />
            <span className="absolute inset-0 bg-linear-to-tr from-navy-950 via-navy-950/70 to-navy-800/30" />
            <span className="absolute inset-x-5 top-5 flex items-center gap-2 text-sm font-semibold text-sun-400 sm:inset-x-8 sm:top-8">
              <Icon.youtube className="h-5 w-5" /> Rekaman ibadah terbaru
            </span>
            <span className="font-display absolute top-16 right-8 left-8 hidden text-4xl leading-[1.05] font-bold text-balance text-cream-100 sm:top-20 sm:block lg:text-5xl">
              Firman yang hidup, setiap hari Minggu.
            </span>
          </LiteYouTube>
        </Reveal>

        <div className="lg:col-span-5">
          <h3 className="font-display text-xl font-bold">Khotbah terbaru</h3>
          <ul className="mt-4 divide-y divide-ink/10">
            {latest.map((sermon, index) => (
              <Reveal as="li" key={sermon.id} delay={index * 60}>
                <a href={sermon.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 py-4">
                  <span className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-xl bg-navy-900 sm:w-36">
                    <Image
                      src={sermon.thumbnail}
                      alt=""
                      fill
                      sizes="9rem"
                      className="object-cover transition duration-700 ease-out-soft group-hover:scale-105"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-ink-soft">
                      {formatIsoDate(sermon.date)} · {sermon.speaker}
                    </span>
                    <span className="font-display mt-1 block text-lg leading-snug font-bold transition-colors group-hover:text-navy-700">
                      {sermon.title}
                    </span>
                  </span>
                </a>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-20 flex items-end justify-between gap-4 border-t border-ink/10 pt-10">
        <h3 className="font-display text-2xl font-bold">Kabar & event</h3>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-12">
        <Reveal className="xl:col-span-7">
          <NewsCard item={featuredItem} past={featuredItem.date < today} featured />
        </Reveal>
        <ul className="grid gap-2 lg:grid-cols-2 xl:col-span-5 xl:grid-cols-1">
          {restItems.map((item, index) => (
            <Reveal as="li" key={item.id} delay={index * 80}>
              <NewsCard item={item} past={item.date < today} featured={false} />
            </Reveal>
          ))}
        </ul>
      </div>
    </Section>
  );
}
