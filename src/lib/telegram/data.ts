import "server-only";

import { getCalendarWindow, getSchedule } from "@/lib/calendar-data";
import { TABLES, type ContactSubmission, type LifeGroupSegment, type Person } from "@/lib/db-types";
import { addDays } from "@/lib/calendar";
import { nextBirthday, phoneDigits, todayWib, upcomingBirthdays } from "@/lib/people";
import { createAdminClient } from "@/lib/supabase/admin";
import { whatsappLink } from "@/lib/whatsapp";

import type { AnniversaryEntry, BirthdayEntry, ScheduleEntry, Topic } from "./format";
import type { Recipient } from "./recipients";

/*
 * Query untuk bot. Semuanya lewat service role, jadi fungsi di sini hanya
 * boleh dipanggil setelah pemanggil memastikan penerimanya tersambung dan
 * aktif (webhook), atau dari admin panel / cron yang sudah diautentikasi.
 */

export const CHATS_TABLE = "enkg_telegram_chats";

export const db = () => createAdminClient();

const firstName = (p: Pick<Person, "full_name" | "nickname">) => p.nickname || p.full_name.split(" ")[0]!;

/* ── Penerima ─────────────────────────────────────────────────────────────── */

/** Penerima yang memakai chat ini (chat pribadi = id pengguna Telegram). */
export async function findRecipientByChat(chatId: number) {
  const { data } = await db().from(CHATS_TABLE).select("*").eq("chat_id", chatId).maybeSingle();
  return (data as Recipient | null) ?? null;
}

export async function findRecipientByDigits(digits: string) {
  const { data } = await db().from(CHATS_TABLE).select("*").eq("phone_digits", digits).maybeSingle();
  return (data as Recipient | null) ?? null;
}

/** Penerima aktif dan sudah tersambung yang mengikuti topik tertentu. */
export async function chatsFor(topic: Topic) {
  const { data, error } = await db()
    .from(CHATS_TABLE)
    .select("*")
    .eq("is_active", true)
    .eq("chat_type", "private")
    .not("chat_id", "is", null)
    .not("telegram_user_id", "is", null)
    .contains("topics", [topic]);
  if (error) console.error("[telegram] chatsFor:", error.message);
  return (data ?? []) as Recipient[];
}

export async function allChats() {
  const { data, error } = await db().from(CHATS_TABLE).select("*").order("created_at");
  return { chats: (data ?? []) as Recipient[], error };
}

/**
 * Sambungkan penerima ke akun Telegram yang nomornya cocok. Akun yang sama
 * dilepas dulu dari penerima lain (mis. admin pernah mendaftarkan nomor lama).
 */
export async function linkRecipient(recipientId: string, chat: { chatId: number; userId: number; by: string }) {
  if (!Number.isSafeInteger(chat.chatId) || !Number.isSafeInteger(chat.userId)) throw new Error("ID Telegram tidak valid");
  const supabase = db();
  await supabase
    .from(CHATS_TABLE)
    .update({ chat_id: null, telegram_user_id: null, linked_at: null, chat_type: null })
    .neq("id", recipientId)
    .or(`chat_id.eq.${chat.chatId},telegram_user_id.eq.${chat.userId}`);
  const { error } = await supabase
    .from(CHATS_TABLE)
    .update({
      chat_id: chat.chatId,
      telegram_user_id: chat.userId,
      chat_type: "private",
      linked_by: chat.by,
      linked_at: new Date().toISOString(),
    })
    .eq("id", recipientId);
  if (error) throw error;
}

/** Pengguna memblokir bot: kembali ke status menunggu sampai dia membuka bot lagi. */
export async function unlinkChat(chatId: number) {
  await db().from(CHATS_TABLE).update({ chat_id: null, telegram_user_id: null, linked_at: null }).eq("chat_id", chatId);
}

/* ── Ulang tahun & anniversary ────────────────────────────────────────────── */

const INACTIVE = "(pindah,tidak_aktif)";

export async function birthdayEntries(today: string, withinDays: number): Promise<BirthdayEntry[]> {
  const { data, error } = await db()
    .from(TABLES.people)
    .select("id, full_name, nickname, birth_date, phone")
    .not("birth_date", "is", null)
    .not("status", "in", INACTIVE)
    .limit(5000);
  if (error) console.error("[telegram] birthdays:", error.message);

  type Row = Pick<Person, "id" | "full_name" | "nickname" | "birth_date" | "phone">;
  return upcomingBirthdays((data ?? []) as Row[], today, withinDays).map(({ person, date, daysUntil, turning }) => ({
    name: person.nickname ? `${person.full_name} (${person.nickname})` : person.full_name,
    date,
    daysUntil,
    turning,
    greetUrl: person.phone
      ? whatsappLink(person.phone, `Selamat ulang tahun, ${firstName(person)}! Tuhan memberkati dan menyertai kamu di tahun yang baru ini.`)
      : null,
  }));
}

export async function anniversaryEntries(today: string, withinDays: number): Promise<AnniversaryEntry[]> {
  const supabase = db();
  const { data: rels, error } = await supabase
    .from(TABLES.relationships)
    .select("person_id, relative_id, married_on")
    .eq("kind", "pasangan")
    .not("married_on", "is", null)
    .limit(5000);
  if (error) console.error("[telegram] anniversaries:", error.message);
  if (!rels?.length) return [];

  const ids = [...new Set(rels.flatMap((r) => [r.person_id, r.relative_id]))];
  const { data: people } = await supabase.from(TABLES.people).select("id, full_name, nickname, gender, status").in("id", ids);
  type Row = Pick<Person, "id" | "full_name" | "nickname" | "gender" | "status">;
  const byId = new Map(((people ?? []) as Row[]).map((p) => [p.id, p]));

  return rels
    .flatMap((rel) => {
      const a = byId.get(rel.person_id);
      const b = byId.get(rel.relative_id);
      if (!a || !b || !rel.married_on) return [];
      // Pasangan yang dua-duanya sudah pindah atau tidak aktif tidak diingatkan.
      if (["pindah", "tidak_aktif"].includes(a.status) && ["pindah", "tidak_aktif"].includes(b.status)) return [];
      const next = nextBirthday(rel.married_on, today);
      if (next.daysUntil > withinDays || next.turning < 1) return [];
      // Suami disebut dulu kalau jenis kelaminnya tercatat.
      const [first, second] = b.gender === "L" && a.gender !== "L" ? [b, a] : [a, b];
      return [{ couple: `${firstName(first)} & ${firstName(second)}`, date: next.date, daysUntil: next.daysUntil, years: next.turning }];
    })
    .sort((x, y) => x.daysUntil - y.daysUntil || x.couple.localeCompare(y.couple, "id"));
}

/* ── Jadwal ───────────────────────────────────────────────────────────────── */

/** Jadwal per tanggal ("yyyy-mm-dd") untuk `days` hari mulai hari ini (WIB). */
export async function scheduleByDay(now: Date, days: number) {
  const today = todayWib(now);
  const dates = Array.from({ length: days }, (_, index) => addDays(today, index));
  const { items } = await getSchedule();
  const window = await getCalendarWindow(items, now);

  const byDay = new Map<string, ScheduleEntry[]>(dates.map((date) => [date, []]));
  for (const occurrence of window.occurrences) {
    const list = byDay.get(occurrence.date);
    if (!list) continue;
    list.push({ start: occurrence.start, title: occurrence.title, place: occurrence.place ?? null, href: occurrence.href ?? null });
  }
  return { today, dates, byDay };
}

/* ── Jemaat baru ──────────────────────────────────────────────────────────── */

export type WaitingPerson = Pick<Person, "id" | "full_name" | "nickname" | "phone" | "area" | "created_at" | "submission_id">;
export type WaitingSubmission = Pick<ContactSubmission, "id" | "name" | "phone" | "domicile" | "life_group" | "age_range" | "created_at">;

/** Jemaat baru tanpa Life Group, plus kiriman "Gabung Life Group" yang belum jadi data jemaat. */
export async function waitingMembers() {
  const supabase = db();
  const since = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString();
  const [people, submissions, known] = await Promise.all([
    supabase
      .from(TABLES.people)
      .select("id, full_name, nickname, phone, area, created_at, submission_id")
      .eq("status", "baru")
      .is("life_group_id", null)
      .order("created_at"),
    supabase
      .from(TABLES.submissions)
      .select("id, name, phone, domicile, life_group, age_range, created_at")
      .eq("form", "lifeGroup")
      .neq("status", "selesai")
      .gte("created_at", since)
      .order("created_at"),
    supabase.from(TABLES.people).select("submission_id, phone").limit(5000),
  ]);

  // Kiriman yang orangnya sudah tercatat (lewat tautan kiriman atau nomor WA yang sama) tidak dihitung lagi.
  const linked = new Set((known.data ?? []).map((row) => row.submission_id).filter(Boolean));
  const phones = new Set((known.data ?? []).map((row) => (row.phone ? phoneDigits(row.phone) : "")).filter(Boolean));
  const pendingSubmissions = ((submissions.data ?? []) as WaitingSubmission[]).filter(
    (item) => !linked.has(item.id) && !phones.has(phoneDigits(item.phone)),
  );

  const waitingPeople = (people.data ?? []) as WaitingPerson[];
  return { people: waitingPeople, submissions: pendingSubmissions, total: waitingPeople.length + pendingSubmissions.length };
}

export type GroupChoice = { id: string; name: string; segment: LifeGroupSegment | null };

/** Life Group aktif, yang kelompoknya cocok dengan pilihan pendaftar ditaruh paling atas. */
export async function groupChoices(preferred?: LifeGroupSegment | null, limit = 6): Promise<GroupChoice[]> {
  const { data } = await db().from(TABLES.lifeGroups).select("id, name, segment").eq("is_active", true).order("name");
  const groups = (data ?? []) as GroupChoice[];
  return groups
    .sort((a, b) => Number(b.segment === preferred) - Number(a.segment === preferred))
    .slice(0, limit);
}
