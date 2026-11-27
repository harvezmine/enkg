import { describe, expect, it } from "vitest";

import { LEADER_EDITABLE_FIELDS, missingEssentials, parsePersonFields } from "./person-fields";

const TODAY = "2026-11-27";
const parse = (values: Record<string, string>) => parsePersonFields((key) => values[key], TODAY);

describe("parsePersonFields", () => {
  it("merapikan isian dan mengosongkan field kosong", () => {
    const result = parse({
      full_name: "  Tesa   Wulandari ",
      nickname: "",
      gender: "P",
      birth_date: "1998-12-02",
      phone: "0899 1234 0001",
      email: "Tesa@Example.com",
      area: " Kelapa Gading ",
    });
    expect(result).toEqual({
      ok: true,
      fields: {
        full_name: "Tesa Wulandari",
        nickname: null,
        gender: "P",
        birth_place: null,
        birth_date: "1998-12-02",
        phone: "0899 1234 0001",
        email: "tesa@example.com",
        photo_path: null,
        address: null,
        area: "Kelapa Gading",
        occupation: null,
      },
    });
  });

  it("mengabaikan field di luar daftar, termasuk status, catatan, dan Life Group", () => {
    const result = parse({
      full_name: "Budi",
      status: "pindah",
      notes: "x",
      life_group_id: "11111111-1111-1111-1111-111111111111",
      life_group_role: "leader",
      edited_by: "Admin",
    });
    expect(result.ok && Object.keys(result.fields).sort()).toEqual([...LEADER_EDITABLE_FIELDS].sort());
  });

  it("menolak nama kosong, tanggal tidak ada, dan tanggal lahir di masa depan", () => {
    expect(parse({ full_name: " " })).toMatchObject({ ok: false });
    expect(parse({ full_name: "Budi", birth_date: "2026-02-30" })).toMatchObject({ ok: false });
    expect(parse({ full_name: "Budi", birth_date: "2026-11-28" })).toEqual({
      ok: false,
      message: "Tanggal lahir tidak boleh setelah hari ini.",
    });
  });

  it("menolak nomor WA terlalu pendek dan email yang salah", () => {
    expect(parse({ full_name: "Budi", phone: "0812" })).toMatchObject({ ok: false });
    expect(parse({ full_name: "Budi", phone: "+62 812-3456-7890" })).toMatchObject({ ok: true });
    expect(parse({ full_name: "Budi", email: "budi@" })).toMatchObject({ ok: false });
  });

  it("hanya menerima path foto hasil rute unggah", () => {
    expect(parse({ full_name: "Budi", photo_path: "0b5c8c1e-1111-4a2b-9c3d-123456789abc.jpg" })).toMatchObject({ ok: true });
    expect(parse({ full_name: "Budi", photo_path: "../enkg-materials/booklet.pdf" })).toMatchObject({ ok: false });
    expect(parse({ full_name: "Budi", photo_path: "https://evil.example/x.jpg" })).toMatchObject({ ok: false });
  });

  it("jenis kelamin di luar L/P dianggap kosong", () => {
    const result = parse({ full_name: "Budi", gender: "X" });
    expect(result.ok && result.fields.gender).toBeNull();
  });
});

describe("missingEssentials", () => {
  it("menyebut data penting yang belum ada", () => {
    expect(missingEssentials({ birth_date: null, phone: "0812", address: null })).toEqual(["tanggal lahir", "alamat"]);
    expect(missingEssentials({ birth_date: "1990-01-01", phone: "0812", address: "Jl. A" })).toEqual([]);
  });
});
