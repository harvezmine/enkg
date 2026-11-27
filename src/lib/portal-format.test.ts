import { describe, expect, it } from "vitest";

import { formatBytes, formatClock, formatLongDate, groupScheduleLabel, safeFileName } from "./portal-format";

describe("format portal", () => {
  it("jadwal rutin grup", () => {
    expect(groupScheduleLabel({ meeting_day: 5, meeting_time: "19:30:00" })).toBe("Setiap Jumat · 19.30 WIB");
    expect(groupScheduleLabel({ meeting_day: null, meeting_time: null })).toBe("");
    expect(formatClock("07:05:00")).toBe("07.05");
  });

  it("tanggal panjang dalam WIB", () => {
    // 13.00 UTC = 20.00 WIB, masih hari yang sama.
    expect(formatLongDate("2026-09-25T13:00:00Z")).toBe("Jumat, 25 September 2026");
    // 20.00 UTC = 03.00 WIB keesokan harinya.
    expect(formatLongDate("2026-09-25T20:00:00Z")).toBe("Sabtu, 26 September 2026");
  });

  it("ukuran file", () => {
    expect(formatBytes(2_400_000)).toBe("2,3 MB");
    expect(formatBytes(300_000)).toBe("293 KB");
    expect(formatBytes(null)).toBe("");
  });

  it("nama file unduhan dibersihkan", () => {
    expect(safeFileName('Booklet "Minggu 1"/../x.pdf')).toBe("Booklet Minggu 1..x.pdf");
    expect(safeFileName("Renungan")).toBe("Renungan.pdf");
    expect(safeFileName("")).toBe("materi.pdf");
  });
});
