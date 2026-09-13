import { news as staticNews, type NewsItem } from "@/content/news";
import { proconEvents as staticProcon, type ProconEvent } from "@/content/procon";
import { TABLES, type ChurchEvent, type Post } from "@/lib/db-types";
import { createPublicClient } from "@/lib/supabase/public";
import { isoDateWib } from "@/lib/utils";

/**
 * Query konten publik dari admin panel.
 *
 * Situs tidak boleh tampil rusak, jadi konten statis (content/news.ts,
 * content/procon.ts) dipakai bila:
 *  1. Supabase belum dikonfigurasi,
 *  2. query gagal (mis. schema.sql belum dijalankan), atau
 *  3. belum ada satu pun konten yang diterbitkan dari admin panel.
 */

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

async function safely<T>(label: string, run: (db: ReturnType<typeof createPublicClient>) => Promise<T>): Promise<T | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    return await run(createPublicClient());
  } catch (error) {
    console.error(`[queries] ${label} gagal:`, error);
    return null;
  }
}

/* ── Pemetaan baris database → bentuk kartu di situs (murni, dites) ───────── */

const COVER_SIZE = { width: 1200, height: 630 };

/** Paragraf pertama tanpa sintaks rich text, dipotong rapi untuk ringkasan kartu. */
export function summarize(text: string | null | undefined, max = 180) {
  if (!text) return "";
  const first =
    text
      .replace(/\r\n/g, "\n")
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .find((block) => block && !block.startsWith("#")) ?? "";
  const plain = first
    .replace(/^\s*(?:[>*-]|\d+[.)])\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*|\*([^*]+)\*/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > max ? `${plain.slice(0, max - 1).trimEnd()}…` : plain;
}

export function postToNewsItem(post: Post): NewsItem {
  return {
    id: post.id,
    type: post.category,
    title: post.title,
    date: isoDateWib(post.published_at ?? post.created_at),
    summary: post.excerpt || summarize(post.body),
    image: post.cover_url ? { src: post.cover_url, alt: post.title, ...COVER_SIZE } : undefined,
    href: `/news/${post.slug}`,
  };
}

export function eventToNewsItem(event: ChurchEvent): NewsItem {
  return {
    id: event.id,
    type: "event",
    title: event.title,
    date: isoDateWib(event.starts_at ?? event.created_at),
    summary: summarize(event.description),
    image: event.cover_url ? { src: event.cover_url, alt: event.title, ...COVER_SIZE } : undefined,
    href: `/event/${event.slug}`,
  };
}

export function eventToProcon(event: ChurchEvent): ProconEvent {
  return {
    id: event.id,
    title: event.title,
    topic: event.topic || "ProCon",
    summary: summarize(event.description),
    date: event.starts_at ? isoDateWib(event.starts_at) : null,
    partner: event.partner ?? undefined,
    href: event.description ? `/event/${event.slug}` : (event.register_url ?? undefined),
  };
}

/* ── Query publik ─────────────────────────────────────────────────────────── */

/** Kabar, artikel, dan event gereja terbaru untuk section News. */
export async function getNewsItems(limit = 6): Promise<NewsItem[]> {
  const items = await safely("getNewsItems", async (db) => {
    const [posts, events] = await Promise.all([
      db.from(TABLES.posts).select("*").eq("published", true).order("published_at", { ascending: false }).limit(limit),
      db
        .from(TABLES.events)
        .select("*")
        .eq("published", true)
        .eq("category", "gereja")
        .order("starts_at", { ascending: false })
        .limit(limit),
    ]);
    if (posts.error) throw posts.error;
    if (events.error) throw events.error;
    return [...(posts.data as Post[]).map(postToNewsItem), ...(events.data as ChurchEvent[]).map(eventToNewsItem)]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);
  });
  return items?.length ? items : staticNews;
}

/** Event ProCon: yang bertanggal paling dekat dulu, yang "Segera hadir" di akhir. */
export async function getProconEvents(): Promise<ProconEvent[]> {
  const items = await safely("getProconEvents", async (db) => {
    const { data, error } = await db
      .from(TABLES.events)
      .select("*")
      .eq("published", true)
      .eq("category", "procon")
      .order("starts_at", { ascending: true, nullsFirst: false })
      .limit(6);
    if (error) throw error;
    return (data as ChurchEvent[]).map(eventToProcon);
  });
  return items?.length ? items : staticProcon;
}

export async function getPostBySlug(slug: string) {
  return safely("getPostBySlug", async (db) => {
    const { data, error } = await db.from(TABLES.posts).select("*").eq("slug", slug).eq("published", true).maybeSingle();
    if (error) throw error;
    return (data as Post | null) ?? null;
  });
}

export async function getEventBySlug(slug: string) {
  return safely("getEventBySlug", async (db) => {
    const { data, error } = await db.from(TABLES.events).select("*").eq("slug", slug).eq("published", true).maybeSingle();
    if (error) throw error;
    return (data as ChurchEvent | null) ?? null;
  });
}

/** Slug News dan event yang sudah terbit, untuk sitemap. */
export async function getPublishedSlugs() {
  const result = await safely("getPublishedSlugs", async (db) => {
    const [posts, events] = await Promise.all([
      db.from(TABLES.posts).select("slug, updated_at").eq("published", true),
      db.from(TABLES.events).select("slug, updated_at").eq("published", true),
    ]);
    if (posts.error) throw posts.error;
    if (events.error) throw events.error;
    type Row = { slug: string; updated_at: string };
    return { posts: posts.data as Row[], events: events.data as Row[] };
  });
  return result ?? { posts: [], events: [] };
}
