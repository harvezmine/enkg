import { describe, expect, it } from "vitest";

import { buildSubmission, isFormKey, isValidPhone } from "./google-forms";

describe("isValidPhone", () => {
  it("menerima format nomor HP Indonesia yang umum", () => {
    expect(isValidPhone("0812-3456-7890")).toBe(true);
    expect(isValidPhone("+62 851 7543 6935")).toBe(true);
    expect(isValidPhone("6285175436935")).toBe(true);
  });

  it("menolak nomor yang terlalu pendek atau bukan HP", () => {
    expect(isValidPhone("12345")).toBe(false);
    expect(isValidPhone("0214567890")).toBe(false);
    expect(isValidPhone("")).toBe(false);
  });
});

const lifeGroup = {
  name: "Budi",
  gender: "Laki-Laki",
  phone: "0812-3456-7890",
  domicile: "Jakarta",
  ageRange: "18 - 25 Tahun",
  group: "Youth",
};

describe("buildSubmission", () => {
  it("memetakan field ke entry ID Google Form", () => {
    const result = buildSubmission("lifeGroup", lifeGroup);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.body.toString()).toBe(
      "entry.45587488=Budi&entry.1212948792=Laki-Laki&entry.733602486=081234567890" +
        "&entry.1242317519=Jakarta&entry.1718285839=18+-+25+Tahun&entry.316669310=Youth",
    );
  });

  it("menolak opsi yang tidak ada di form asli", () => {
    expect(buildSubmission("lifeGroup", { ...lifeGroup, group: "Senior" })).toEqual({
      ok: false,
      fieldErrors: { group: "Pilih life group." },
    });
  });

  it("mewajibkan semua field dan memvalidasi nomor WhatsApp", () => {
    const result = buildSubmission("prayer", {
      name: "",
      gender: "Perempuan",
      phone: "12345",
      request: "Kesehatan ibu",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.fieldErrors).sort()).toEqual(["name", "phone"]);
  });

  it("menerima nomor berawalan +62 dengan spasi", () => {
    const result = buildSubmission("prayer", {
      name: "Ani",
      gender: "Perempuan",
      phone: "+62 812 3456 7890",
      request: "Pekerjaan",
    });
    expect(result.ok).toBe(true);
  });
});

describe("isFormKey", () => {
  it("hanya menerima nama form yang terdaftar", () => {
    expect(isFormKey("prayer")).toBe(true);
    expect(isFormKey("toString")).toBe(false);
    expect(isFormKey("__proto__")).toBe(false);
    expect(isFormKey(null)).toBe(false);
  });
});
