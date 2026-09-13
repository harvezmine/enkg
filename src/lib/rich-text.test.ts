import { describe, expect, it } from "vitest";

import { parseInline, parseRichText } from "./rich-text";

describe("parseRichText", () => {
  it("memisahkan judul, paragraf, kutipan, dan daftar", () => {
    const source = [
      "## Kenapa kami berkumpul",
      "Baris pertama",
      "baris kedua.",
      "",
      "> Hendaklah kamu saling mengasihi",
      "> seperti Aku telah mengasihi kamu.",
      "",
      "- Doa",
      "- Firman",
      "1. Datang",
      "2. Bertumbuh",
      "### Penutup",
      "Sampai jumpa.",
    ].join("\r\n");

    expect(parseRichText(source)).toEqual([
      { type: "h2", text: "Kenapa kami berkumpul" },
      { type: "p", text: "Baris pertama baris kedua." },
      { type: "quote", text: "Hendaklah kamu saling mengasihi seperti Aku telah mengasihi kamu." },
      { type: "ul", items: ["Doa", "Firman"] },
      { type: "ol", items: ["Datang", "Bertumbuh"] },
      { type: "h3", text: "Penutup" },
      { type: "p", text: "Sampai jumpa." },
    ]);
  });

  it("mengembalikan array kosong untuk teks kosong", () => {
    expect(parseRichText("  \n\n ")).toEqual([]);
  });
});

describe("parseInline", () => {
  it("mengenali tebal dan miring", () => {
    expect(parseInline("Datang **tepat waktu** ya, *bawa teman*.")).toEqual([
      { kind: "text", text: "Datang " },
      { kind: "strong", text: "tepat waktu" },
      { kind: "text", text: " ya, " },
      { kind: "em", text: "bawa teman" },
      { kind: "text", text: "." },
    ]);
  });

  it("membiarkan bintang tunggal apa adanya", () => {
    expect(parseInline("Harga 5 * 2 tetap teks")).toEqual([{ kind: "text", text: "Harga 5 * 2 tetap teks" }]);
  });
});
