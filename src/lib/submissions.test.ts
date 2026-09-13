import { describe, expect, it } from "vitest";

import { toSubmissionRow } from "./submissions";

describe("toSubmissionRow", () => {
  it("memetakan isian Life Group dan merapikan nomor WhatsApp", () => {
    expect(
      toSubmissionRow("lifeGroup", {
        name: " Budi ",
        gender: "Laki-Laki",
        phone: "0812-3456 7890",
        domicile: "Jakarta",
        ageRange: "18 - 25 Tahun",
        group: "Youth",
        request: "tidak dipakai",
      }),
    ).toEqual({
      form: "lifeGroup",
      name: "Budi",
      gender: "Laki-Laki",
      phone: "081234567890",
      domicile: "Jakarta",
      age_range: "18 - 25 Tahun",
      life_group: "Youth",
      request: null,
    });
  });

  it("hanya menyimpan kolom yang relevan untuk permohonan doa", () => {
    expect(
      toSubmissionRow("prayer", { name: "Ani", gender: "Perempuan", phone: "+62 812 3456 7890", request: "Kesehatan ibu", group: "Youth" }),
    ).toEqual({
      form: "prayer",
      name: "Ani",
      gender: "Perempuan",
      phone: "+6281234567890",
      domicile: null,
      age_range: null,
      life_group: null,
      request: "Kesehatan ibu",
    });
  });
});
