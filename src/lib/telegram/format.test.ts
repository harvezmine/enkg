import { describe, expect, it } from "vitest";

import {
  buildDigest,
  decodeAssign,
  encodeAssign,
  escapeHtml,
  longDay,
  newMemberMessage,
  packUuid,
  parseCommand,
  prayerMessage,
  unpackUuid,
  type DigestInput,
} from "./format";
import { bearerMatches, secretMatches } from "./secret";

const PERSON = "78e2726a-a50f-4c1d-88e2-e06b59fec9be";
const GROUP = "4e5b0822-ffe6-4a2e-8818-7458588a81bb";

describe("escape HTML Telegram", () => {
  it("meng-escape tanda yang dipakai parse_mode HTML", () => {
    expect(escapeHtml(`<b>Tom & "Jerry"</b>`)).toBe("&lt;b&gt;Tom &amp; &quot;Jerry&quot;&lt;/b&gt;");
    expect(escapeHtml(null)).toBe("");
  });

  it("nama jemaat tidak bisa menyisipkan tag ke pesan", () => {
    const html = newMemberMessage({ name: "<i>Budi</i>", phone: "0812", area: "Gading & Sunter", wish: null, source: "situs" });
    expect(html).toContain("&lt;i&gt;Budi&lt;/i&gt;");
    expect(html).toContain("Gading &amp; Sunter");
    expect(html).not.toContain("<i>Budi");
  });
});

describe("permohonan doa", () => {
  it("isi permohonan dan nama di-escape, plus tautan admin", () => {
    const html = prayerMessage({
      name: "Rina <b>",
      phone: "0812",
      request: 'Doakan "ujian" <script>alert(1)</script> & keluarga',
      adminUrl: "https://everynationkg.com/admin/kontak?form=prayer",
    });
    expect(html).toContain("Rina &lt;b&gt;");
    expect(html).toContain("&quot;ujian&quot; &lt;script&gt;alert(1)&lt;/script&gt; &amp; keluarga");
    expect(html).not.toContain("<script>");
    expect(html).toContain('<a href="https://everynationkg.com/admin/kontak?form=prayer">');
  });

  it("tanpa alamat publik tetap menyebut menu Contact Us", () => {
    expect(prayerMessage({ name: "Rina", request: "x".repeat(5000) })).toContain("/admin/kontak");
    expect(prayerMessage({ name: "Rina", request: "x".repeat(5000) }).length).toBeLessThan(3400);
  });
});

describe("perintah", () => {
  it("membaca perintah biasa dan perintah grup dengan @namabot", () => {
    expect(parseCommand("/jadwal")).toEqual({ command: "jadwal", args: "" });
    expect(parseCommand("/hubungkan@EnkgBot  ABCD2345 ")).toEqual({ command: "hubungkan", args: "ABCD2345" });
    expect(parseCommand("halo semua")).toBeNull();
    expect(parseCommand(undefined)).toBeNull();
  });
});

describe("callback_data", () => {
  it("UUID dipadatkan jadi 22 karakter dan bisa dibalik", () => {
    const packed = packUuid(PERSON);
    expect(packed).toHaveLength(22);
    expect(unpackUuid(packed)).toBe(PERSON);
  });

  it("muat di batas 64 byte Telegram dan bisa dibaca lagi", () => {
    for (const kind of ["person", "submission"] as const) {
      const data = encodeAssign({ kind, id: PERSON }, GROUP);
      expect(Buffer.byteLength(data)).toBeLessThanOrEqual(64);
      expect(decodeAssign(data)).toEqual({ target: { kind, id: PERSON }, groupId: GROUP });
    }
  });

  it("menolak data yang dirusak", () => {
    expect(decodeAssign("a:x123:456")).toBeNull();
    expect(decodeAssign(encodeAssign({ kind: "person", id: PERSON }, GROUP).slice(0, -1))).toBeNull();
    expect(decodeAssign(undefined)).toBeNull();
    expect(() => packUuid("bukan-uuid")).toThrow();
  });
});

describe("ringkasan harian", () => {
  const base: DigestInput = {
    today: "2026-11-27",
    tomorrow: "2026-11-28",
    topics: ["ulang_tahun", "anniversary", "jadwal", "jemaat_baru"],
    birthdays: [
      { name: "Budi Santoso (Budi)", date: "2026-11-27", daysUntil: 0, turning: 42, greetUrl: "https://wa.me/6281211112222?text=Selamat" },
      { name: "Joe", date: "2026-11-30", daysUntil: 3, turning: 31 },
    ],
    anniversaries: [{ couple: "Budi & Ani", date: "2026-11-28", daysUntil: 1, years: 15 }],
    scheduleToday: [{ start: "18:00", title: "Onsite Prayer Meeting", place: "Stream Hall" }],
    scheduleTomorrow: [],
    waitingCount: 2,
  };

  it("memuat semua topik yang diikuti", () => {
    const html = buildDigest(base)!;
    expect(html).toContain("Jumat, 27 November");
    expect(html).toContain("Budi Santoso (Budi), ke-42 · hari ini");
    expect(html).toContain('<a href="https://wa.me/6281211112222?text=Selamat">kirim ucapan</a>');
    expect(html).toContain("Joe, ke-31 · Sen 30 Nov");
    expect(html).toContain("Budi &amp; Ani, 15 tahun · besok");
    expect(html).toContain("<b>18.00</b> Onsite Prayer Meeting · Stream Hall");
    expect(html).toContain("Tidak ada jadwal.");
    expect(html).toContain("2 jemaat baru");
  });

  it("hanya topik yang dipilih chat itu", () => {
    const html = buildDigest({ ...base, topics: ["jadwal"] })!;
    expect(html).toContain("Jadwal hari ini");
    expect(html).not.toContain("Ulang tahun");
    expect(html).not.toContain("jemaat baru");
  });

  it("tidak mengirim apa pun kalau tidak ada kabar", () => {
    expect(
      buildDigest({ ...base, birthdays: [], anniversaries: [], scheduleToday: [], scheduleTomorrow: [], waitingCount: 0 }),
    ).toBeNull();
  });

  it("menulis tanggal dalam bahasa Indonesia", () => {
    expect(longDay("2026-11-29")).toBe("Minggu, 29 November");
  });
});

describe("rahasia", () => {
  it("membandingkan secret webhook persis", () => {
    expect(secretMatches("abc", "abc")).toBe(true);
    expect(secretMatches("abd", "abc")).toBe(false);
    expect(secretMatches(null, "abc")).toBe(false);
    expect(secretMatches("abc", "")).toBe(false);
  });

  it("Bearer cron wajib cocok dan minimal 16 karakter", () => {
    const secret = "cron-secret-1234567890";
    expect(bearerMatches(`Bearer ${secret}`, secret)).toBe(true);
    expect(bearerMatches(`Bearer salah`, secret)).toBe(false);
    expect(bearerMatches(`Bearer short`, "short")).toBe(false);
    expect(bearerMatches(null, secret)).toBe(false);
  });
});
