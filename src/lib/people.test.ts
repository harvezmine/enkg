import { describe, expect, it } from "vitest";

import type { Relationship } from "./db-types";
import {
  ageOn,
  familyOf,
  familySummary,
  formatCalendarDate,
  initials,
  isValidDate,
  matchesQuery,
  nextBirthday,
  relationFor,
  relationLabel,
  toStoredRelation,
  todayWib,
  upcomingBirthdays,
} from "./people";

describe("tanggal & umur", () => {
  it("menghitung umur sebelum dan sesudah ulang tahun", () => {
    expect(ageOn("1990-03-12", "2026-03-11")).toBe(35);
    expect(ageOn("1990-03-12", "2026-03-12")).toBe(36);
  });

  it("memakai tanggal Jakarta, bukan UTC", () => {
    // 20.00 UTC tanggal 31 Des = 03.00 WIB tanggal 1 Jan.
    expect(todayWib(new Date("2026-12-31T20:00:00Z"))).toBe("2027-01-01");
  });

  it("menolak tanggal yang tidak ada", () => {
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("2024-02-29")).toBe(true);
    expect(isValidDate("12-03-1990")).toBe(false);
  });

  it("menulis tanggal dalam bahasa Indonesia", () => {
    expect(formatCalendarDate("1990-03-12")).toBe("12 Maret 1990");
  });
});

describe("ulang tahun berikutnya", () => {
  it("hari ini dihitung 0 hari lagi", () => {
    expect(nextBirthday("1990-11-26", "2026-11-26")).toEqual({ date: "2026-11-26", daysUntil: 0, turning: 36 });
  });

  it("yang sudah lewat pindah ke tahun depan", () => {
    expect(nextBirthday("1990-01-05", "2026-12-30")).toEqual({ date: "2027-01-05", daysUntil: 6, turning: 37 });
  });

  it("29 Februari dirayakan 28 Februari di tahun biasa", () => {
    expect(nextBirthday("2000-02-29", "2027-02-01").date).toBe("2027-02-28");
    expect(nextBirthday("2000-02-29", "2028-02-01").date).toBe("2028-02-29");
  });

  it("mengurutkan yang paling dekat dan membuang yang jauh", () => {
    const people = [
      { full_name: "Citra", birth_date: "1995-12-20" },
      { full_name: "Andi", birth_date: "1988-11-27" },
      { full_name: "Budi", birth_date: "1992-06-01" },
      { full_name: "Dewi", birth_date: null },
    ];
    expect(upcomingBirthdays(people, "2026-11-26", 30).map((item) => item.person.full_name)).toEqual(["Andi", "Citra"]);
  });
});

describe("relasi keluarga", () => {
  it("menyimpan orang tua dengan person_id = orang tua", () => {
    expect(toStoredRelation("anak", "ayah", "orang_tua")).toEqual({
      person_id: "ayah",
      relative_id: "anak",
      kind: "orang_tua",
    });
    expect(toStoredRelation("ayah", "anak", "anak")).toEqual({ person_id: "ayah", relative_id: "anak", kind: "orang_tua" });
  });

  it("membaca relasi dari kedua sisi", () => {
    const rel = { person_id: "ayah", relative_id: "anak", kind: "orang_tua" as const };
    expect(relationFor(rel, "ayah")).toEqual({ relativeId: "anak", as: "anak" });
    expect(relationFor(rel, "anak")).toEqual({ relativeId: "ayah", as: "orang_tua" });
  });

  it("memberi sebutan sesuai jenis kelamin dan umur", () => {
    const viewer = { gender: "L" as const, birth_date: "1990-01-01" };
    expect(relationLabel("pasangan", { gender: "P", birth_date: null }, viewer)).toBe("Istri");
    expect(relationLabel("orang_tua", { gender: "L", birth_date: null }, viewer)).toBe("Ayah");
    expect(relationLabel("saudara", { gender: "P", birth_date: "1987-05-01" }, viewer)).toBe("Kakak");
    expect(relationLabel("saudara", { gender: "P", birth_date: "1994-05-01" }, viewer)).toBe("Adik");
    expect(relationLabel("saudara", { gender: null, birth_date: null }, viewer)).toBe("Saudara");
  });

  it("menyusun keluarga: pasangan, anak tertua dulu, lalu orang tua", () => {
    const people = [
      { id: "budi", full_name: "Budi", gender: "L" as const, birth_date: "1985-01-01" },
      { id: "ani", full_name: "Ani", gender: "P" as const, birth_date: "1987-01-01" },
      { id: "kecil", full_name: "Kecil", gender: "L" as const, birth_date: "2018-01-01" },
      { id: "besar", full_name: "Besar", gender: "P" as const, birth_date: "2014-01-01" },
      { id: "opa", full_name: "Opa", gender: "L" as const, birth_date: "1955-01-01" },
    ];
    const rel = (id: string, person_id: string, relative_id: string, kind: Relationship["kind"]): Relationship => ({
      id,
      person_id,
      relative_id,
      kind,
      married_on: null,
      created_at: "",
    });
    const relationships = [
      rel("1", "budi", "kecil", "orang_tua"),
      rel("2", "opa", "budi", "orang_tua"),
      rel("3", "ani", "budi", "pasangan"),
      rel("4", "budi", "besar", "orang_tua"),
      rel("5", "ani", "kecil", "orang_tua"),
    ];
    const byId = new Map(people.map((p) => [p.id, p]));

    expect(familyOf(byId.get("budi")!, relationships, byId).map((m) => `${m.label}:${m.person.id}`)).toEqual([
      "Istri:ani",
      "Anak:besar",
      "Anak:kecil",
      "Ayah:opa",
    ]);
  });
});

describe("ringkasan keluarga", () => {
  it("menyebut pasangan, jumlah anak, dan orang tua", () => {
    expect(
      familySummary([
        { as: "pasangan", label: "Istri" },
        { as: "anak", label: "Anak" },
        { as: "anak", label: "Anak" },
        { as: "orang_tua", label: "Ibu" },
      ]),
    ).toBe("Istri · 2 anak · Ibu");
    expect(familySummary([])).toBe("");
  });
});

describe("pencarian", () => {
  const person = {
    full_name: "Yohanes Santoso",
    nickname: "Joe",
    area: "Kelapa Gading",
    phone: "+62 812-3456-7890",
    email: null,
  };

  it("cocok dengan nama, panggilan, atau wilayah tanpa peduli huruf besar", () => {
    expect(matchesQuery(person, "santoso")).toBe(true);
    expect(matchesQuery(person, "joe gading")).toBe(true);
    expect(matchesQuery(person, "andi")).toBe(false);
    expect(matchesQuery(person, "young", "Young Professional Gading")).toBe(true);
  });

  it("nomor 08xx dan +62 dianggap sama", () => {
    expect(matchesQuery(person, "0812 3456")).toBe(true);
  });

  it("inisial dari dua kata pertama", () => {
    expect(initials("yohanes budi santoso")).toBe("YB");
    expect(initials("Maria")).toBe("M");
  });
});
