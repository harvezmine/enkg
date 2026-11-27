import type { Gender, Person, RelationKind, Relationship } from "./db-types";
import { isoDateWib } from "./utils";

/*
 * Logika murni database jemaat: umur, ulang tahun, relasi keluarga, dan
 * pencarian. Tanggal lahir disimpan sebagai "yyyy-mm-dd" tanpa jam, jadi
 * semua hitungan di sini memakai tanggal kalender biasa, bukan objek Date
 * berzona waktu yang bisa menggeser tanggal di server ber-UTC.
 */

const DAY_MS = 86_400_000;

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

type Ymd = { y: number; m: number; d: number };

function parse(date: string): Ymd {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d };
}

const pad = (n: number) => String(n).padStart(2, "0");
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const dayNumber = ({ y, m, d }: Ymd) => Date.UTC(y, m - 1, d) / DAY_MS;

/** Tanggal hari ini di Jakarta, "yyyy-mm-dd". */
export function todayWib(now = new Date()) {
  return isoDateWib(now.toISOString());
}

/** "yyyy-mm-dd" yang benar-benar ada di kalender (menolak 2026-02-30). */
export function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const { y, m, d } = parse(value);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function ageOn(birthDate: string, today: string) {
  const b = parse(birthDate);
  const t = parse(today);
  const age = t.y - b.y;
  return t.m < b.m || (t.m === b.m && t.d < b.d) ? age - 1 : age;
}

export type Birthday = {
  /** Tanggal ulang tahun berikutnya, "yyyy-mm-dd". */
  date: string;
  /** 0 berarti hari ini. */
  daysUntil: number;
  /** Umur yang dicapai pada tanggal itu. */
  turning: number;
};

/**
 * Ulang tahun berikutnya, termasuk hari ini. Yang lahir 29 Februari
 * dirayakan 28 Februari pada tahun yang bukan kabisat.
 */
export function nextBirthday(birthDate: string, today: string): Birthday {
  const b = parse(birthDate);
  const t = parse(today);
  const inYear = (y: number): Ymd => ({ y, m: b.m, d: b.m === 2 && b.d === 29 && !isLeap(y) ? 28 : b.d });

  let next = inYear(t.y);
  if (dayNumber(next) < dayNumber(t)) next = inYear(t.y + 1);

  return {
    date: `${next.y}-${pad(next.m)}-${pad(next.d)}`,
    daysUntil: dayNumber(next) - dayNumber(t),
    turning: next.y - b.y,
  };
}

/** Yang berulang tahun dalam `withinDays` hari ke depan, yang paling dekat dulu. */
export function upcomingBirthdays<T extends Pick<Person, "full_name" | "birth_date">>(
  people: T[],
  today: string,
  withinDays = 30,
) {
  return people
    .flatMap((person) => {
      if (!person.birth_date) return [];
      const birthday = nextBirthday(person.birth_date, today);
      return birthday.daysUntil <= withinDays ? [{ person, ...birthday }] : [];
    })
    .sort((a, b) => a.daysUntil - b.daysUntil || a.person.full_name.localeCompare(b.person.full_name, "id"));
}

/** "Hari ini", "Besok", "5 hari lagi" */
export function birthdayPhrase(daysUntil: number) {
  if (daysUntil === 0) return "Hari ini";
  if (daysUntil === 1) return "Besok";
  return `${daysUntil} hari lagi`;
}

/** "12 Maret" */
export function formatDayMonth(date: string) {
  const { m, d } = parse(date);
  return `${d} ${MONTHS[m - 1]}`;
}

/** "12 Maret 1990" */
export function formatCalendarDate(date: string | null | undefined) {
  if (!date) return "";
  const { y } = parse(date);
  return `${formatDayMonth(date)} ${y}`;
}

/** Nama bulan untuk filter ulang tahun, 1 = Januari. */
export function monthName(month: number) {
  return MONTHS[month - 1] ?? "";
}

export function birthMonth(date: string | null | undefined) {
  return date ? parse(date).m : null;
}

/** "Budi Santoso" → "BS", "Maria" → "M" */
export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0]!.toLocaleUpperCase("id"))
    .join("");
}

/** Indeks warna tetap per orang, supaya avatar inisial tidak berganti tiap muat ulang. */
export function toneIndex(id: string, tones: number) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % tones;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Relasi keluarga
   ═══════════════════════════════════════════════════════════════════════════ */

/** Relasi dilihat dari sisi seseorang: "dia adalah ___ saya". */
export type RelationAs = "pasangan" | "orang_tua" | "anak" | "saudara";

export const RELATION_AS_OPTIONS: { value: RelationAs; label: string }[] = [
  { value: "pasangan", label: "Suami / istri" },
  { value: "anak", label: "Anak" },
  { value: "orang_tua", label: "Ayah / ibu" },
  { value: "saudara", label: "Kakak / adik" },
];

const RELATION_ORDER: RelationAs[] = ["pasangan", "anak", "orang_tua", "saudara"];

/** "Dia adalah `as` saya" → baris yang disimpan di enkg_relationships. */
export function toStoredRelation(
  viewerId: string,
  relativeId: string,
  as: RelationAs,
): { person_id: string; relative_id: string; kind: RelationKind } {
  switch (as) {
    case "orang_tua":
      return { person_id: relativeId, relative_id: viewerId, kind: "orang_tua" };
    case "anak":
      return { person_id: viewerId, relative_id: relativeId, kind: "orang_tua" };
    default:
      return { person_id: viewerId, relative_id: relativeId, kind: as };
  }
}

/** Kebalikan toStoredRelation: relasi tersimpan dilihat dari sisi `viewerId`. */
export function relationFor(rel: Pick<Relationship, "person_id" | "relative_id" | "kind">, viewerId: string) {
  const relativeId = rel.person_id === viewerId ? rel.relative_id : rel.person_id;
  const as: RelationAs =
    rel.kind === "orang_tua" ? (rel.person_id === viewerId ? "anak" : "orang_tua") : rel.kind;
  return { relativeId, as };
}

type Kin = { gender: Gender | null; birth_date: string | null };

/** Sebutan untuk kerabat: "Istri", "Ayah", "Kakak", ... */
export function relationLabel(as: RelationAs, relative: Kin, viewer: Kin) {
  switch (as) {
    case "pasangan":
      return relative.gender === "L" ? "Suami" : relative.gender === "P" ? "Istri" : "Pasangan";
    case "orang_tua":
      return relative.gender === "L" ? "Ayah" : relative.gender === "P" ? "Ibu" : "Orang tua";
    case "anak":
      return "Anak";
    case "saudara":
      if (relative.birth_date && viewer.birth_date && relative.birth_date !== viewer.birth_date) {
        return relative.birth_date < viewer.birth_date ? "Kakak" : "Adik";
      }
      return "Saudara";
  }
}

export type FamilyMember<P> = { relationshipId: string; person: P; as: RelationAs; label: string };

/**
 * Keluarga seseorang dari daftar relasi: pasangan dulu, lalu anak (yang
 * tertua dulu), orang tua, dan saudara.
 */
export function familyOf<P extends Kin & { id: string; full_name: string }>(
  viewer: P,
  relationships: Relationship[],
  peopleById: Map<string, P>,
): FamilyMember<P>[] {
  return relationships
    .filter((rel) => rel.person_id === viewer.id || rel.relative_id === viewer.id)
    .flatMap((rel) => {
      const { relativeId, as } = relationFor(rel, viewer.id);
      const person = peopleById.get(relativeId);
      return person ? [{ relationshipId: rel.id, person, as, label: relationLabel(as, person, viewer) }] : [];
    })
    .sort(
      (a, b) =>
        RELATION_ORDER.indexOf(a.as) - RELATION_ORDER.indexOf(b.as) ||
        (a.person.birth_date ?? "9999").localeCompare(b.person.birth_date ?? "9999") ||
        a.person.full_name.localeCompare(b.person.full_name, "id"),
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Pencarian
   ═══════════════════════════════════════════════════════════════════════════ */

const fold = (value: string) =>
  value
    .toLocaleLowerCase("id")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** "+62 812-3456" dan "0812 3456" dianggap nomor yang sama. */
export function phoneDigits(phone: string) {
  return phone.replace(/\D/g, "").replace(/^62/, "0");
}

/** Cocokkan kata kunci dengan nama, panggilan, wilayah, email, nama Life Group, atau nomor WA. */
export function matchesQuery(
  person: Pick<Person, "full_name" | "nickname" | "area" | "phone" | "email">,
  query: string,
  extra?: string | null,
) {
  const q = fold(query.trim());
  if (!q) return true;

  const haystack = fold(
    [person.full_name, person.nickname, person.area, person.email, extra].filter(Boolean).join(" "),
  );
  if (q.split(/\s+/).every((word) => haystack.includes(word))) return true;

  const digits = phoneDigits(q);
  return digits.length >= 4 && Boolean(person.phone) && phoneDigits(person.phone!).includes(digits);
}

/** Ringkasan keluarga untuk kartu: "Istri · 2 anak · Ibu". */
export function familySummary(members: Pick<FamilyMember<unknown>, "as" | "label">[]) {
  const of = (as: RelationAs) => members.filter((member) => member.as === as);
  const spouses = of("pasangan");
  const children = of("anak");
  const parents = of("orang_tua");
  const siblings = of("saudara");

  return [
    spouses.length === 1 ? spouses[0]!.label : spouses.length ? `${spouses.length} pasangan` : "",
    children.length ? `${children.length} anak` : "",
    parents.length === 1 ? parents[0]!.label : parents.length ? "Orang tua" : "",
    siblings.length ? `${siblings.length} saudara` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}
