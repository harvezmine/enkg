import { describe, expect, it } from "vitest";

import videos from "@/content/youtube-videos.json";

import { parseSermonTitle, sermonDate } from "./sermons";

describe("parseSermonTitle", () => {
  it.each([
    [
      '(Live Recording)   6 September  " The End  " ~ Ps. Raswan Gautama',
      { title: "The End", speaker: "Ps. Raswan Gautama", day: 6, month: 9 },
    ],
    [
      "(Live Recording)   30 Agustus '' 7 Years, One Faithful God \" ~ Ps. Raswan Gautama",
      { title: "7 Years, One Faithful God", speaker: "Ps. Raswan Gautama", day: 30, month: 8 },
    ],
    [
      '(Live Recording) 7 Juni  " Disukai Semua Orang  "~ Ps. Raswan Gautama &  Ibu Sharon Gautama',
      { title: "Disukai Semua Orang", speaker: "Ps. Raswan Gautama & Ibu Sharon Gautama", day: 7, month: 6 },
    ],
    [
      "(Live Recording) 15 maret  '' IMAN YANG HIDUP '' ~ Bp. Youdy Siby",
      { title: "Iman Yang Hidup", speaker: "Bp. Youdy Siby", day: 15, month: 3 },
    ],
    [
      "Live Recording) 1 Februari  '' Ketika Tuhan Berkata Sekarang!  '' ~ Ps Raswan Gautama",
      { title: "Ketika Tuhan Berkata Sekarang!", speaker: "Ps. Raswan Gautama", day: 1, month: 2 },
    ],
    [
      "(Live Recording) 22 Maret  '' What Happens When We Fail ? '' ~ Ps. Raswan Gautama",
      { title: "What Happens When We Fail?", speaker: "Ps. Raswan Gautama", day: 22, month: 3 },
    ],
  ])("mem-parse %s", (raw, expected) => {
    expect(parseSermonTitle(raw)).toEqual({ kind: "sermon", ...expected });
  });

  it("menganggap judul tanpa pola tanggal/pembicara sebagai video biasa", () => {
    expect(parseSermonTitle("7 Years of Caleidoscope — 7 Years, One Faithful God")).toEqual({
      kind: "video",
      title: "7 Years of Caleidoscope — 7 Years, One Faithful God",
    });
    expect(parseSermonTitle("Campus Missionaries - 1st Anniversary Every Nation Kelapa Gading").kind).toBe(
      "video",
    );
  });

  it("mengenali semua rekaman khotbah di snapshot channel", () => {
    const parsed = videos.map((video) => parseSermonTitle(video.title));
    const sermons = parsed.filter((p) => p.kind === "sermon");

    expect(sermons).toHaveLength(29);
    for (const sermon of sermons) {
      expect(sermon.title.length).toBeGreaterThan(2);
      expect(sermon.speaker).toMatch(/^(Ps|Bp)\. /);
    }
  });
});

describe("sermonDate", () => {
  it("memakai tahun unggah", () => {
    expect(sermonDate(6, 9, "2026-09-09")).toBe("2026-09-06");
  });

  it("mundur setahun untuk khotbah Desember yang diunggah Januari", () => {
    expect(sermonDate(28, 12, "2027-01-03")).toBe("2026-12-28");
  });
});
