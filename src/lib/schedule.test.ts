import { describe, expect, it } from "vitest";

import { formatJakartaDate, formatJakartaTime, nextOccurrence, recurrenceLabel } from "./schedule";

const sunday = { kind: "weekly", weekday: 0 } as const;
const wednesday = { kind: "weekly", weekday: 3 } as const;
const fourthFriday = { kind: "monthly-nth", weekday: 5, nth: 4 } as const;
const iso = (date: Date) => date.toISOString();

describe("nextOccurrence", () => {
  it("mengembalikan ibadah hari ini bila belum dimulai", () => {
    // Minggu 13 Sep 2026, 08.00 WIB
    expect(iso(nextOccurrence(sunday, "10:00", new Date("2026-09-13T01:00:00Z")))).toBe(
      "2026-09-13T03:00:00.000Z",
    );
  });

  it("melompat ke minggu depan bila ibadah hari ini sudah dimulai", () => {
    // Minggu 13 Sep 2026, 11.00 WIB
    expect(iso(nextOccurrence(sunday, "10:00", new Date("2026-09-13T04:00:00Z")))).toBe(
      "2026-09-20T03:00:00.000Z",
    );
  });

  it("memakai tanggal Jakarta walau di UTC masih hari sebelumnya", () => {
    // Sabtu 12 Sep 20.00 UTC = Minggu 13 Sep 03.00 WIB
    expect(iso(nextOccurrence(sunday, "10:00", new Date("2026-09-12T20:00:00Z")))).toBe(
      "2026-09-13T03:00:00.000Z",
    );
  });

  it("menghitung jadwal mingguan di hari lain", () => {
    expect(iso(nextOccurrence(wednesday, "20:00", new Date("2026-09-13T01:00:00Z")))).toBe(
      "2026-09-16T13:00:00.000Z",
    );
  });

  it("menemukan Jumat ke-4 bulan ini", () => {
    expect(iso(nextOccurrence(fourthFriday, "18:00", new Date("2026-09-13T01:00:00Z")))).toBe(
      "2026-09-25T11:00:00.000Z",
    );
  });

  it("pindah ke Jumat ke-4 bulan depan setelah lewat", () => {
    expect(iso(nextOccurrence(fourthFriday, "18:00", new Date("2026-09-26T00:00:00Z")))).toBe(
      "2026-10-23T11:00:00.000Z",
    );
  });
});

describe("label & format", () => {
  it("menulis pola jadwal dalam bahasa Indonesia", () => {
    expect(recurrenceLabel(wednesday)).toBe("Setiap Rabu");
    expect(recurrenceLabel(fourthFriday)).toBe("Jumat ke-4 setiap bulan");
  });

  it("memformat tanggal & jam dalam WIB", () => {
    const date = new Date("2026-09-25T11:00:00Z");
    expect(formatJakartaDate(date)).toBe("Jumat, 25 September");
    expect(formatJakartaTime(date)).toBe("18.00 WIB");
  });
});
