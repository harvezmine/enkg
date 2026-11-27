import { describe, expect, it } from "vitest";

import { schedule } from "@/content/schedule";

import {
  addMonths,
  eventToOccurrence,
  expandItems,
  fromStatic,
  isCalendarDate,
  isClock,
  lastDayOfMonth,
  lgMeetingToOccurrence,
  lifeGroupOccurrences,
  lifeGroupRoutineText,
  sortLifeGroups,
  weekStart,
  monthGrid,
  nextItemOccurrence,
  occursOn,
  recurrenceText,
  recurringBySlug,
  rhythmGroups,
  rowToItem,
  sortOccurrences,
  toClock,
  type CalendarItem,
} from "./calendar";
import type { ScheduleRow } from "./db-types";
import { nextOccurrence } from "./schedule";

const row = (overrides: Partial<ScheduleRow>): ScheduleRow => ({
  id: "row-1",
  slug: null,
  title: "Ibadah Minggu",
  category: "ibadah",
  recurrence: "weekly",
  weekday: 0,
  nth: null,
  on_date: null,
  start_time: "10:00:00",
  end_time: null,
  place: "Stream Hall",
  mode: "onsite",
  link_url: null,
  note: null,
  published: true,
  sort_order: 0,
  created_at: "",
  updated_at: "",
  ...overrides,
});

describe("tanggal kalender", () => {
  it("menyusun bulan mulai hari Minggu", () => {
    // 1 September 2026 jatuh hari Selasa.
    const weeks = monthGrid("2026-09");
    expect(weeks[0]).toEqual([null, null, "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05"]);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
  });

  it("berpindah bulan dan tahun", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(lastDayOfMonth("2028-02")).toBe("2028-02-29");
  });

  it("memeriksa tanggal dan jam", () => {
    expect(isCalendarDate("2026-02-30")).toBe(false);
    expect(isCalendarDate("2026-02-28")).toBe(true);
    expect(isClock("24:00")).toBe(false);
    expect(isClock("09:15")).toBe(true);
    expect(toClock("18:30:00")).toBe("18:30");
    expect(toClock(null)).toBeNull();
  });
});

describe("pola jadwal", () => {
  it("mingguan, minggu ke-n, dan sekali", () => {
    expect(occursOn({ kind: "weekly", weekday: 3 }, "2026-09-16")).toBe(true);
    expect(occursOn({ kind: "weekly", weekday: 3 }, "2026-09-17")).toBe(false);
    expect(occursOn({ kind: "monthly-nth", weekday: 5, nth: 4 }, "2026-09-25")).toBe(true);
    expect(occursOn({ kind: "monthly-nth", weekday: 5, nth: 4 }, "2026-09-18")).toBe(false);
    expect(occursOn({ kind: "once", date: "2026-12-24" }, "2026-12-24")).toBe(true);
  });

  it("menulis polanya dalam bahasa Indonesia", () => {
    expect(recurrenceText({ kind: "monthly-nth", weekday: 5, nth: 4 })).toBe("Jumat ke-4 setiap bulan");
    expect(recurrenceText({ kind: "once", date: "2026-12-24" })).toBe("Sekali, 24 Desember 2026");
  });

  it("acara sekali yang sudah lewat tidak punya jadwal berikutnya", () => {
    const item = fromStatic(schedule[0]!);
    const once: CalendarItem = { ...item, recurrence: { kind: "once", date: "2026-09-01" } };
    expect(nextItemOccurrence(once, new Date("2026-09-02T00:00:00Z"))).toBeNull();
    expect(nextItemOccurrence(once, new Date("2026-08-31T00:00:00Z"))?.toISOString()).toBe("2026-09-01T02:15:00.000Z");
  });

  it("minggu ke-5 yang jarang tetap ketemu walau lebih dari dua bulan lagi", () => {
    // Jumat ke-5 setelah 31 Juli 2026 baru ada 30 Oktober 2026.
    expect(nextOccurrence({ kind: "monthly-nth", weekday: 5, nth: 5 }, "19:00", new Date("2026-08-01T00:00:00Z")).toISOString()).toBe(
      "2026-10-30T12:00:00.000Z",
    );
  });
});

describe("baris database", () => {
  it("memetakan baris mingguan dan bulanan", () => {
    expect(rowToItem(row({}))).toMatchObject({ start: "10:00", recurrence: { kind: "weekly", weekday: 0 } });
    expect(
      rowToItem(row({ recurrence: "monthly_nth", weekday: 5, nth: 4, start_time: "18:00:00", end_time: "20:00:00" })),
    ).toMatchObject({ recurrence: { kind: "monthly-nth", weekday: 5, nth: 4 }, end: "20:00" });
  });

  it("membuang baris yang polanya tidak lengkap", () => {
    expect(rowToItem(row({ recurrence: "monthly_nth", nth: null }))).toBeNull();
    expect(rowToItem(row({ recurrence: "once", on_date: null }))).toBeNull();
    expect(rowToItem(row({ start_time: "jam sepuluh" }))).toBeNull();
  });

  it("memakai jadwal bawaan bila slug tidak ada di database", () => {
    const items = [rowToItem(row({ slug: "sunday-service", start_time: "09:00:00" }))!];
    expect(recurringBySlug(items, "sunday-service", schedule)?.start).toBe("09:00");
    expect(recurringBySlug([], "sunday-service", schedule)?.start).toBe("10:00");
    expect(recurringBySlug([], "tidak-ada", schedule)).toBeNull();
  });
});

describe("kejadian di kalender", () => {
  const items = schedule.map(fromStatic);

  it("mengurai jadwal bawaan dalam satu minggu", () => {
    // Minggu 20 s.d. Sabtu 26 September 2026: empat jadwal Minggu, doa Rabu, Jumat ke-4.
    const list = sortOccurrences(expandItems(items, "2026-09-20", "2026-09-26"));
    expect(list.map((item) => `${item.date} ${item.start} ${item.title}`)).toEqual([
      "2026-09-20 09:15 Doa Sebelum Ibadah",
      "2026-09-20 10:00 Ibadah Minggu",
      "2026-09-20 10:30 Heritage",
      "2026-09-20 10:30 Kids Church",
      "2026-09-23 20:00 Weekly Prayer Meeting",
      "2026-09-25 18:00 Onsite Prayer Meeting",
    ]);
    expect(list[4]).toMatchObject({ mode: "online", hrefLabel: "Buka Zoom" });
  });

  it("event gereja memakai tanggal dan jam Jakarta", () => {
    const occurrence = eventToOccurrence({
      id: "e1",
      slug: "natal",
      title: "Ibadah Natal",
      starts_at: "2026-12-24T11:00:00Z",
      ends_at: "2026-12-24T13:00:00Z",
      location: "Stream Hall",
    });
    expect(occurrence).toMatchObject({ date: "2026-12-24", start: "18:00", end: "20:00", href: "/event/natal", category: "acara" });
  });

  it("pertemuan Life Group hanya membawa nama, jam, dan wilayah", () => {
    const occurrence = lgMeetingToOccurrence({
      id: "m1",
      starts_at: "2026-09-25T12:30:00Z",
      name: "Young Professional Sunter",
      segment: "young_professional",
      area: "Sunter",
    });
    expect(occurrence).toMatchObject({ title: "Life Group Young Professional Sunter", start: "19:30", place: "Sunter" });
    expect(lgMeetingToOccurrence({ id: "m2", starts_at: "2026-09-25T12:30:00Z", name: "LG Family", segment: null, area: null }).title).toBe(
      "LG Family",
    );
  });

  it("mengelompokkan ritme mingguan, hari Minggu dulu", () => {
    const groups = rhythmGroups(items, new Date("2026-09-14T00:00:00Z"));
    expect(groups.map((group) => group.label)).toEqual(["Setiap Minggu", "Setiap Rabu", "Jumat ke-4 setiap bulan"]);
    expect(groups[0]!.items.map((item) => item.start)).toEqual(["09:15", "10:00", "10:30", "10:30"]);
  });
});

describe("Life Group di kalender publik", () => {
  const family = {
    id: "g-family",
    name: "Family Kelapa Gading",
    segment: "family" as const,
    area: "Kelapa Gading",
    meeting_day: 5,
    meeting_time: "19:30:00",
  };
  const youth = { id: "g-youth", name: "Youth Mahaka", segment: "youth" as const, area: null, meeting_day: null, meeting_time: null };

  it("pekan dimulai hari Minggu", () => {
    expect(weekStart("2026-11-27")).toBe("2026-11-22");
    expect(weekStart("2026-11-22")).toBe("2026-11-22");
  });

  it("grup tampil tiap pekan di hari & jam rutinnya", () => {
    const list = lifeGroupOccurrences([family], [], "2026-11-01", "2026-11-30");
    expect(list.map((o) => o.date)).toEqual(["2026-11-06", "2026-11-13", "2026-11-20", "2026-11-27"]);
    expect(list[0]).toMatchObject({ title: "Life Group Family Kelapa Gading", start: "19:30", place: "Kelapa Gading", href: "#gabung-family" });
  });

  it("pertemuan dari leader menggantikan jadwal rutin di pekan yang sama", () => {
    // Pekan 22-28 Nov: leader memindah ke Sabtu 28 Nov 18.00.
    const moved = { id: "m1", groupId: "g-family", starts_at: "2026-11-28T11:00:00Z", name: family.name, segment: family.segment, area: family.area };
    const list = lifeGroupOccurrences([family], [moved], "2026-11-01", "2026-11-30");
    expect(list.map((o) => `${o.date} ${o.start}`).sort()).toEqual([
      "2026-11-06 19:30",
      "2026-11-13 19:30",
      "2026-11-20 19:30",
      "2026-11-28 18:00",
    ]);
    expect(list.find((o) => o.date === "2026-11-28")?.note).toContain("Jumat 19.30");
  });

  it("pertemuan di jam rutin tidak diberi catatan bergeser", () => {
    const same = { id: "m2", groupId: "g-family", starts_at: "2026-11-27T12:30:00Z", name: family.name, segment: family.segment, area: family.area };
    const list = lifeGroupOccurrences([family], [same], "2026-11-22", "2026-11-28");
    expect(list).toHaveLength(1);
    expect(list[0]!.note).toBeUndefined();
  });

  it("grup tanpa jadwal tetap hanya tampil lewat pertemuan dari leader", () => {
    expect(lifeGroupOccurrences([youth], [], "2026-11-01", "2026-11-30")).toEqual([]);
    const meeting = { id: "m3", groupId: "g-youth", starts_at: "2026-11-21T09:00:00Z", name: youth.name, segment: youth.segment, area: null };
    expect(lifeGroupOccurrences([youth], [meeting], "2026-11-01", "2026-11-30").map((o) => o.date)).toEqual(["2026-11-21"]);
  });

  it("pertemuan di luar rentang tidak tampil, tapi tetap menggantikan jadwal rutin pekannya", () => {
    // Rentang mulai Rabu 2 Des; pertemuan Senin 30 Nov ada di pekan yang sama dengan Jumat 4 Des.
    const meeting = { id: "m4", groupId: "g-family", starts_at: "2026-11-30T12:00:00Z", name: family.name, segment: family.segment, area: family.area };
    expect(lifeGroupOccurrences([family], [meeting], "2026-12-02", "2026-12-12").map((o) => o.date)).toEqual(["2026-12-11"]);
  });

  it("menulis jadwal rutin dan mengurutkan grup per hari", () => {
    expect(lifeGroupRoutineText(family)).toBe("Setiap Jumat · 19.30");
    expect(lifeGroupRoutineText(youth)).toBe("Jadwal menyesuaikan");
    const sunday = { ...family, id: "g-sun", name: "Family Sunter", meeting_day: 0, meeting_time: "16:00:00" };
    expect(sortLifeGroups([youth, family, sunday]).map((g) => g.id)).toEqual(["g-sun", "g-family", "g-youth"]);
  });

  it("tidak pernah membawa kolom privat ke kejadian publik", () => {
    const withPrivate = { ...family, location: "Jl. Rahasia No. 1" } as typeof family & { location: string };
    const json = JSON.stringify(lifeGroupOccurrences([withPrivate], [], "2026-11-01", "2026-11-30"));
    expect(json).not.toContain("Rahasia");
  });
});
