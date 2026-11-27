import { describe, expect, it } from "vitest";

import { matchByName, parseWib } from "./match";

const people = [
  { full_name: "Budi Santoso", nickname: "Budi" },
  { full_name: "Budi Hartono", nickname: null },
  { full_name: "Anita Santoso", nickname: "Ani" },
];
const names = (p: (typeof people)[number]) => [p.full_name, p.nickname];

describe("cocok nama", () => {
  it("kecocokan persis didahulukan", () => {
    expect(matchByName(people, "budi santoso", names)).toHaveLength(1);
    expect(matchByName(people, "Ani", names)[0]!.full_name).toBe("Anita Santoso");
  });

  it("nama ambigu mengembalikan semua kandidat", () => {
    expect(matchByName(people, "hartono budi", names)).toHaveLength(1);
    expect(matchByName(people, "santoso", names)).toHaveLength(2);
  });

  it("kata kunci kosong tidak mencocokkan apa pun", () => {
    expect(matchByName(people, "  ", names)).toEqual([]);
  });
});

describe("tanggal WIB dari asisten", () => {
  it("membaca YYYY-MM-DD HH:MM sebagai WIB", () => {
    expect(parseWib("2026-12-20 16:00")).toBe("2026-12-20T09:00:00.000Z");
    expect(parseWib("2026-12-20T9.30")).toBe("2026-12-20T02:30:00.000Z");
  });

  it("menolak format lain", () => {
    expect(parseWib("20/12/2026 16:00")).toBeNull();
    expect(parseWib("besok sore")).toBeNull();
  });
});
