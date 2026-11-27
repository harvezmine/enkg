import type { Gender } from "./db-types";
import { isValidDate, phoneDigits } from "./people";

/*
 * Membaca & memvalidasi isian data diri jemaat. Murni (tanpa database),
 * dipakai portal leader dan bisa dipakai admin. Aturannya sama dengan
 * savePerson di actions/people.ts.
 */

/** Path foto hasil rute unggah: "<uuid>.jpg|png|webp". Path lain ditolak. */
export const PHOTO_PATH = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Field yang boleh diubah leader. Status, catatan, Life Group, dan peran tidak termasuk. */
export const LEADER_EDITABLE_FIELDS = [
  "full_name",
  "nickname",
  "gender",
  "birth_place",
  "birth_date",
  "phone",
  "email",
  "photo_path",
  "address",
  "area",
  "occupation",
] as const;

export type PersonFields = {
  full_name: string;
  nickname: string | null;
  gender: Gender | null;
  birth_place: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  photo_path: string | null;
  address: string | null;
  area: string | null;
  occupation: string | null;
};

export type ParsedPersonFields = { ok: true; fields: PersonFields } | { ok: false; message: string };

/** Batas panjang per field, sama dengan admin. */
const MAX: Record<(typeof LEADER_EDITABLE_FIELDS)[number], number> = {
  full_name: 160,
  nickname: 60,
  gender: 2,
  birth_place: 80,
  birth_date: 10,
  phone: 40,
  email: 200,
  photo_path: 120,
  address: 400,
  area: 80,
  occupation: 120,
};

const orNull = (value: string) => (value === "" ? null : value);

/**
 * `get` mengembalikan nilai mentah sebuah field (mis. dari FormData). Field
 * di luar daftar tidak pernah dibaca, jadi isian tambahan dari form diabaikan.
 */
export function parsePersonFields(get: (key: string) => unknown, today: string): ParsedPersonFields {
  const read = (key: (typeof LEADER_EDITABLE_FIELDS)[number]) => String(get(key) ?? "").trim().slice(0, MAX[key]);

  const fullName = read("full_name").replace(/\s+/g, " ");
  const birthDate = read("birth_date");
  const phone = read("phone");
  const email = read("email").toLowerCase();
  const photoPath = read("photo_path");
  const gender = read("gender");

  if (fullName.length < 2) return { ok: false, message: "Nama lengkap wajib diisi." };
  if (birthDate && !isValidDate(birthDate)) return { ok: false, message: "Tanggal lahir tidak valid." };
  if (birthDate && birthDate > today) return { ok: false, message: "Tanggal lahir tidak boleh setelah hari ini." };
  if (phone && !/^\d{8,15}$/.test(phoneDigits(phone))) {
    return { ok: false, message: "Nomor WhatsApp sepertinya belum lengkap. Tulis seperti 0812 3456 7890." };
  }
  if (email && !EMAIL.test(email)) return { ok: false, message: "Alamat email belum benar." };
  if (photoPath && !PHOTO_PATH.test(photoPath)) return { ok: false, message: "Foto tidak valid. Unggah ulang fotonya." };

  return {
    ok: true,
    fields: {
      full_name: fullName,
      nickname: orNull(read("nickname")),
      gender: gender === "L" || gender === "P" ? gender : null,
      birth_place: orNull(read("birth_place")),
      birth_date: orNull(birthDate),
      phone: orNull(phone),
      email: orNull(email),
      photo_path: orNull(photoPath),
      address: orNull(read("address")),
      area: orNull(read("area")),
      occupation: orNull(read("occupation")),
    },
  };
}

/** Data yang sebaiknya ada supaya leader bisa menyapa, mengingat ulang tahun, dan berkunjung. */
export function missingEssentials(person: { birth_date: string | null; phone: string | null; address: string | null }) {
  return [
    !person.phone ? "nomor WA" : null,
    !person.birth_date ? "tanggal lahir" : null,
    !person.address ? "alamat" : null,
  ].filter((item): item is string => Boolean(item));
}
