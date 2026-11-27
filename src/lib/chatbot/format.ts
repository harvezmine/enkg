import { site } from "@/content/site";

/*
 * Pengurai jawaban chatbot menjadi potongan aman untuk dirender React. Tidak
 * ada HTML mentah: hanya teks, **tebal**, daftar, baris baru, dan tautan ke
 * alamat yang sudah dikenal. Tautan lain ditampilkan sebagai teks biasa.
 */

export type Inline =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "link"; text: string; href: string; external: boolean };

export type Block = { type: "paragraph"; lines: Inline[][] } | { type: "list"; items: Inline[][] };

/** Alamat luar yang boleh ditautkan: hanya yang memang ada di konten situs. */
const KNOWN_URLS = [site.maps.link, site.zoom.url, site.socials.instagram, site.socials.youtube, site.socials.facebook];

export function safeHref(raw: string): { href: string; external: boolean } | null {
  const href = raw.trim();
  if (/^#[a-z0-9-]{1,40}$/i.test(href)) return { href, external: false };
  if (/^\/(?!\/)[a-z0-9/_-]{0,80}(#[a-z0-9-]+)?$/i.test(href)) return { href, external: false };
  if (/^https:\/\/wa\.me\/\d{8,15}(\?text=[^\s<>"']{0,600})?$/.test(href)) return { href, external: true };
  if (KNOWN_URLS.includes(href as (typeof KNOWN_URLS)[number])) return { href, external: true };
  return null;
}

const TOKEN = /\[([^\]\n]{1,120})\]\(([^)\s]{1,700})\)|\*\*([^*\n]{1,200})\*\*|(https:\/\/wa\.me\/[^\s)<>"']+)/g;

export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    if (match.index > last) out.push({ type: "text", text: text.slice(last, match.index) });
    const [whole, label, href, bold, bare] = match;
    if (bold !== undefined) {
      out.push({ type: "bold", text: bold });
    } else {
      const target = safeHref(href ?? bare ?? "");
      if (target) out.push({ type: "link", text: label ?? "hubungi kami lewat WhatsApp", ...target });
      else out.push({ type: "text", text: label ?? whole });
    }
    last = match.index + whole.length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  return out.filter((part) => part.type !== "text" || part.text);
}

const LIST_ITEM = /^\s*(?:[-*•]|\d+[.)])\s+/;

export function parseReply(raw: string): Block[] {
  // Jaring pengaman gaya tulisan: tanpa tanda pisah panjang, tanpa judul markdown.
  const text = raw
    .replace(/\r\n/g, "\n")
    .replace(/\s*—\s*/g, ", ")
    .replace(/^#{1,6}\s+/gm, "");

  const blocks: Block[] = [];
  for (const chunk of text.split(/\n{2,}/)) {
    const lines = chunk.split("\n").filter((line) => line.trim());
    if (!lines.length) continue;
    let paragraph: Inline[][] = [];
    let list: Inline[][] = [];
    const flush = () => {
      if (paragraph.length) blocks.push({ type: "paragraph", lines: paragraph });
      if (list.length) blocks.push({ type: "list", items: list });
      paragraph = [];
      list = [];
    };
    for (const line of lines) {
      if (LIST_ITEM.test(line)) {
        if (paragraph.length) {
          blocks.push({ type: "paragraph", lines: paragraph });
          paragraph = [];
        }
        list.push(parseInline(line.replace(LIST_ITEM, "").trim()));
      } else {
        if (list.length) {
          blocks.push({ type: "list", items: list });
          list = [];
        }
        paragraph.push(parseInline(line.trim()));
      }
    }
    flush();
  }
  return blocks;
}
