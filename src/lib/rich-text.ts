/**
 * Parser teks sederhana untuk isi News dan event dari admin panel.
 *
 * Sengaja tidak memakai library markdown: kebutuhannya hanya paragraf, dua
 * tingkat judul, kutipan, dan daftar. Hasilnya dirender sebagai elemen React
 * (bukan dangerouslySetInnerHTML), jadi tidak ada celah HTML injection.
 *
 * Sintaks yang didukung:
 *   ## Judul      → h2
 *   ### Judul     → h3
 *   > Kutipan     → blockquote
 *   - item        → daftar berpoin
 *   1. item       → daftar bernomor
 *   **tebal**     → <strong>
 *   *miring*      → <em>
 */

export type RichBlock = { type: "h2" | "h3" | "p" | "quote"; text: string } | { type: "ul" | "ol"; items: string[] };

type ListBlock = Extract<RichBlock, { type: "ul" | "ol" }>;

export function parseRichText(source: string): RichBlock[] {
  const blocks: RichBlock[] = [];
  // Disimpan dalam objek agar penyempitan tipe tidak hilang saat dimutasi lintas iterasi.
  const buf: { paragraph: string[]; quote: string[]; list: ListBlock | null } = { paragraph: [], quote: [], list: null };

  const flushParagraph = () => {
    if (buf.paragraph.length) blocks.push({ type: "p", text: buf.paragraph.join(" ") });
    buf.paragraph = [];
  };
  const flushQuote = () => {
    if (buf.quote.length) blocks.push({ type: "quote", text: buf.quote.join(" ") });
    buf.quote = [];
  };
  const flushList = () => {
    if (buf.list) blocks.push(buf.list);
    buf.list = null;
  };
  const flushAll = () => {
    flushParagraph();
    flushQuote();
    flushList();
  };

  for (const raw of source.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) {
      flushAll();
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      flushParagraph();
      flushQuote();
      const type: ListBlock["type"] = bullet ? "ul" : "ol";
      const text = (bullet ?? numbered)![1];
      if (buf.list?.type === type) {
        buf.list.items.push(text);
      } else {
        flushList();
        buf.list = { type, items: [text] };
      }
      continue;
    }
    flushList();

    if (line.startsWith(">")) {
      flushParagraph();
      buf.quote.push(line.replace(/^>\s?/, ""));
    } else if (line.startsWith("### ")) {
      flushAll();
      blocks.push({ type: "h3", text: line.slice(4) });
    } else if (line.startsWith("## ")) {
      flushAll();
      blocks.push({ type: "h2", text: line.slice(3) });
    } else {
      flushQuote();
      buf.paragraph.push(line);
    }
  }

  flushAll();
  return blocks;
}

export type InlinePart = { kind: "text" | "strong" | "em"; text: string };

/** **tebal** dan *miring* → potongan bertipe, dirender komponen RichText. */
export function parseInline(text: string): InlinePart[] {
  return text
    .split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g)
    .filter(Boolean)
    .map((part) => {
      if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) return { kind: "strong", text: part.slice(2, -2) };
      if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) return { kind: "em", text: part.slice(1, -1) };
      return { kind: "text", text: part };
    });
}
