import { describe, expect, it } from "vitest";

import {
  EVENT_COLUMNS,
  FORBIDDEN_PERSON_FIELDS,
  FORBIDDEN_SUBMISSION_FIELDS,
  LIFE_GROUP_COLUMNS,
  PERSON_COLUMNS,
  POST_COLUMNS,
  SUBMISSION_COLUMNS,
  lifeGroupOut,
  memberOut,
  personOut,
  submissionOut,
} from "./projections";

/** Baris lengkap seperti `select *`, berisi semua data pribadi. */
const fullPerson = {
  id: "p1",
  full_name: "Budi Santoso",
  nickname: "Budi",
  phone: "0812 1111 2222",
  gender: "L",
  birth_place: "Jakarta",
  birth_date: "1984-11-28",
  email: "budi@example.com",
  photo_path: "abc.jpg",
  address: "Jl. Rahasia 1",
  area: "Kelapa Gading",
  occupation: "Wiraswasta",
  life_group_id: "g1",
  life_group_role: "leader",
  status: "aktif",
  joined_on: "2018-03-04",
  baptized_on: "2019-04-21",
  notes: "CATATAN PASTORAL",
  submission_id: null,
  edited_by: "Admin",
  created_at: "",
  updated_at: "",
} as const;

const fullSubmission = {
  id: "s1",
  form: "prayer",
  name: "Kezia",
  gender: "Perempuan",
  phone: "0857",
  domicile: "Jakarta",
  age_range: "18 - 25 tahun",
  life_group: "Youth",
  request: "ISI DOA PRIBADI",
  status: "baru",
  admin_notes: "catatan",
  created_at: "2026-11-27T00:00:00Z",
  updated_at: "",
} as const;

const values = (obj: object) => JSON.stringify(obj);

describe("batas data jemaat untuk asisten", () => {
  it("personOut hanya membawa id, nama, panggilan, dan WA", () => {
    const out = personOut(fullPerson as never);
    expect(Object.keys(out).sort()).toEqual(["id", "nama", "panggilan", "wa"]);
    for (const secret of ["1984-11-28", "Jl. Rahasia", "budi@example.com", "CATATAN", "Kelapa Gading", "Wiraswasta", "abc.jpg"]) {
      expect(values(out)).not.toContain(secret);
    }
  });

  it("memberOut menambah peran LG saja", () => {
    const out = memberOut(fullPerson as never);
    expect(Object.keys(out).sort()).toEqual(["id", "nama", "panggilan", "peran", "wa"]);
  });

  it("kolom query jemaat tidak memuat field terlarang", () => {
    const columns = PERSON_COLUMNS.split(",").map((c) => c.trim());
    for (const field of FORBIDDEN_PERSON_FIELDS) expect(columns).not.toContain(field);
  });
});

describe("batas data lain", () => {
  it("kiriman Contact Us tanpa isi doa, domisili, umur, atau catatan", () => {
    const out = submissionOut(fullSubmission as never);
    expect(values(out)).not.toContain("ISI DOA");
    expect(Object.keys(out).sort()).toEqual(["id", "jenis", "nama", "status", "tanggal", "wa"]);
    const columns = SUBMISSION_COLUMNS.split(",").map((c) => c.trim());
    for (const field of FORBIDDEN_SUBMISSION_FIELDS) expect(columns).not.toContain(field);
  });

  it("Life Group tidak pernah membawa alamat tempat pertemuan", () => {
    expect(LIFE_GROUP_COLUMNS).not.toContain("location");
    const out = lifeGroupOut({ id: "g1", name: "Heritage", segment: "youth", meeting_day: 6, meeting_time: "16:00:00", area: "Kelapa Gading", is_active: true });
    expect(out).toMatchObject({ nama: "Heritage", kelompok: "Youth", jadwal: "Setiap Sabtu · 16.00 WIB" });
    expect(values({ ...out })).not.toContain("location");
  });

  it("kolom event & News tidak memuat isi panjang", () => {
    expect(EVENT_COLUMNS).not.toMatch(/description|address/);
    expect(POST_COLUMNS).not.toMatch(/body|author/);
  });
});
