import { describe, expect, it } from "vitest";

import { formatTime, fromWibInput, isoDateWib, slugify, toWibInput } from "./utils";

describe("slugify", () => {
  it("membuat slug huruf kecil dengan tanda hubung", () => {
    expect(slugify("Ibadah Paskah 2026: Kebangkitan!")).toBe("ibadah-paskah-2026-kebangkitan");
  });

  it("membuang aksen dan tanda hubung di tepi", () => {
    expect(slugify("  Café Kasih — Kelapa Gading  ")).toBe("cafe-kasih-kelapa-gading");
  });
});

describe("jam WIB untuk form event", () => {
  it("membaca input datetime-local sebagai WIB", () => {
    expect(fromWibInput("2026-09-25T18:00")).toBe("2026-09-25T11:00:00.000Z");
  });

  it("menolak format yang tidak lengkap", () => {
    expect(fromWibInput("2026-09-25")).toBeNull();
    expect(fromWibInput("")).toBeNull();
  });

  it("mengembalikan ISO ke nilai input dalam WIB", () => {
    expect(toWibInput("2026-09-25T11:00:00.000Z")).toBe("2026-09-25T18:00");
    expect(toWibInput(null)).toBe("");
  });

  it("memformat jam dan tanggal menurut Jakarta", () => {
    expect(formatTime("2026-09-25T11:00:00.000Z")).toBe("18.00 WIB");
    // 20.00 UTC = 03.00 WIB keesokan harinya
    expect(isoDateWib("2026-09-25T20:00:00.000Z")).toBe("2026-09-26");
  });
});
