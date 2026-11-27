import { describe, expect, it } from "vitest";

import {
  findExisting,
  headerField,
  markDuplicatesInFile,
  matchByName,
  parseDateCell,
  parseCsv,
  parseGender,
  parseSheet,
  parseStatus,
  parseTeams,
  sanitizeRaw,
  serializeRaw,
} from "./people-import";

const TODAY = "2026-11-27";

describe("judul kolom", () => {
  it("mengenali judul template dan sebutan lain", () => {
    expect(headerField("Nama lengkap")).toBe("full_name");
    expect(headerField("NO. WA")).toBe("phone");
    expect(headerField("Tgl Lahir")).toBe("birth_date");
    expect(headerField("Suami/Istri")).toBe("spouse");
    expect(headerField("Hobi")).toBeNull();
  });
});

describe("tanggal", () => {
  it("membaca hari/bulan/tahun cara Indonesia", () => {
    expect(parseDateCell("12/03/1990", TODAY).value).toBe("1990-03-12");
    expect(parseDateCell("5-1-88", TODAY).value).toBe("1988-01-05");
  });

  it("membaca nama bulan Indonesia dan format ISO", () => {
    expect(parseDateCell("12 Maret 1990", TODAY).value).toBe("1990-03-12");
    expect(parseDateCell("3 Agt 2001", TODAY).value).toBe("2001-08-03");
    expect(parseDateCell("1990-03-12", TODAY).value).toBe("1990-03-12");
  });

  it("membaca sel tanggal dan nomor seri Excel", () => {
    expect(parseDateCell(new Date(Date.UTC(1990, 2, 12)), TODAY).value).toBe("1990-03-12");
    expect(parseDateCell(32944, TODAY).value).toBe("1990-03-12");
  });

  it("melaporkan tanggal yang tidak ada", () => {
    expect(parseDateCell("31/02/1990", TODAY).error).toBeTruthy();
    expect(parseDateCell("kemarin", TODAY).error).toBeTruthy();
  });
});

describe("nilai pilihan", () => {
  it("jenis kelamin", () => {
    expect(parseGender("Laki-laki").value).toBe("L");
    expect(parseGender("wanita").value).toBe("P");
    expect(parseGender("X").error).toBeTruthy();
  });

  it("status, kosong berarti aktif", () => {
    expect(parseStatus("Jemaat baru").value).toBe("baru");
    expect(parseStatus("Tidak aktif").value).toBe("tidak_aktif");
    expect(parseStatus("").value).toBe("aktif");
  });

  it("pelayanan dengan peran", () => {
    expect(parseTeams("Musisi: Keyboard; Usher, Doa (Syafaat)")).toEqual([
      { team: "Musisi", role: "Keyboard" },
      { team: "Usher", role: null },
      { team: "Doa", role: "Syafaat" },
    ]);
  });
});

describe("lembar kerja", () => {
  it("menemukan baris judul, melewati baris kosong, dan memberi nomor baris Excel", () => {
    const result = parseSheet(
      [
        ["Data jemaat ENKG", null, null],
        ["Nama", "No WA", "Tgl Lahir"],
        ["Budi Santoso", 81211112222, "28/11/1984"],
        [null, null, null],
        ["Ani", "0813 3333 4444", "salah"],
      ],
      TODAY,
    );
    if ("error" in result) throw new Error(result.error);
    expect(result.rows.map((row) => row.line)).toEqual([3, 5]);
    expect(result.rows[0]!.values).toMatchObject({ full_name: "Budi Santoso", phone: "081211112222", birth_date: "1984-11-28" });
    expect(result.rows[1]!.issues[0]!.level).toBe("warning");
  });

  it("menolak file tanpa kolom nama", () => {
    expect(parseSheet([["Alamat"], ["Jl. A"]], TODAY)).toHaveProperty("error");
  });

  it("menandai baris dobel di file yang sama", () => {
    const result = parseSheet(
      [
        ["Nama", "WA"],
        ["Budi", "0812 1111 2222"],
        ["Budi S", "+62 812-1111-2222"],
      ],
      TODAY,
    );
    if ("error" in result) throw new Error(result.error);
    const rows = markDuplicatesInFile(result.rows);
    expect(rows[1]!.issues).toContainEqual({ level: "error", message: "Dobel dengan baris 2" });
  });
});

describe("pencocokan dengan database", () => {
  const existing = [
    { id: "a", full_name: "Budi Santoso", phone: "0812 1111 2222", birth_date: "1984-11-28" },
    { id: "b", full_name: "Maria Lestari", phone: null, birth_date: null },
  ];
  const values = (patch: object) =>
    ({ id: null, full_name: "", phone: null, birth_date: null, ...patch }) as Parameters<typeof findExisting>[0];

  it("cocok lewat nomor WA walau formatnya beda", () => {
    expect(findExisting(values({ full_name: "Pak Budi", phone: "+62812-1111-2222" }), existing)?.id).toBe("a");
  });

  it("cocok lewat nama, tapi tanggal lahir berbeda berarti orang lain", () => {
    expect(findExisting(values({ full_name: "maria  lestari" }), existing)?.id).toBe("b");
    expect(findExisting(values({ full_name: "Budi Santoso", birth_date: "2000-01-01" }), existing)).toBeNull();
  });

  it("mencocokkan nama grup tanpa peduli huruf besar", () => {
    expect(matchByName("yp  sunter", [{ name: "YP Sunter" }])).toEqual({ name: "YP Sunter" });
  });
});

describe("CSV dan kiriman", () => {
  it("menebak pemisah titik koma dan membaca tanda kutip", () => {
    expect(parseCsv('Nama;Alamat\r\nBudi;"Jl. A; No. 1"\r\n"Ani ""Nona""";"baris\nkedua"')).toEqual([
      ["Nama", "Alamat"],
      ["Budi", "Jl. A; No. 1"],
      ['Ani "Nona"', "baris\nkedua"],
    ]);
  });

  it("tanggal Excel dikirim sebagai yyyy-mm-dd dan field asing dibuang", () => {
    expect(serializeRaw({ birth_date: new Date(Date.UTC(1990, 2, 12)), full_name: "Budi" })).toEqual({
      birth_date: "1990-03-12",
      full_name: "Budi",
    });
    expect(sanitizeRaw({ full_name: "Budi", hacker: "x", phone: { $ne: 1 } })).toEqual({ full_name: "Budi" });
  });
});
