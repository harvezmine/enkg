import "server-only";

import { revalidatePath } from "next/cache";

import { TABLES, type ContactSubmission, type Person } from "@/lib/db-types";
import { leaderNotice } from "@/lib/life-group-notify";
import { phoneDigits } from "@/lib/people";
import { segmentFromLabel } from "@/lib/people-options";

import { rows, type InlineButton, type InlineKeyboard } from "./api";
import { publicAdminUrl } from "./config";
import { db, groupChoices } from "./data";
import { encodeAssign, escapeHtml, newMemberMessage, type AssignTarget } from "./format";

/*
 * Kartu jemaat baru di Telegram (pesan + tombol Life Group) dan aksi assign
 * dari tombol itu. Pemanggil wajib sudah memastikan chat-nya tertaut, aktif,
 * dan mengikuti topik jemaat_baru.
 */

type PersonRow = Pick<Person, "id" | "full_name" | "nickname" | "phone" | "area" | "status" | "life_group_id" | "submission_id">;
const PERSON_COLUMNS = "id, full_name, nickname, phone, area, status, life_group_id, submission_id";

function adminButton(target: AssignTarget): InlineButton[] {
  const url = publicAdminUrl(target.kind === "person" ? `/admin/jemaat/${target.id}` : `/admin/jemaat/baru?kiriman=${target.id}`);
  return url ? [{ text: "Buka di admin", url }] : [];
}

/**
 * Pesan untuk satu jemaat baru beserta tombol Life Group. Null kalau orangnya
 * sudah punya grup atau datanya tidak ditemukan.
 */
export async function memberCard(target: AssignTarget, source: "situs" | "admin"): Promise<{ html: string; keyboard: InlineKeyboard } | null> {
  const supabase = db();
  let person: PersonRow | null = null;
  let submission: ContactSubmission | null = null;

  if (target.kind === "person") {
    const { data } = await supabase.from(TABLES.people).select(PERSON_COLUMNS).eq("id", target.id).maybeSingle();
    person = data as PersonRow | null;
    if (!person) return null;
    if (person.submission_id) {
      const { data: sub } = await supabase.from(TABLES.submissions).select("*").eq("id", person.submission_id).maybeSingle();
      submission = sub as ContactSubmission | null;
    }
  } else {
    const { data: sub } = await supabase.from(TABLES.submissions).select("*").eq("id", target.id).maybeSingle();
    submission = sub as ContactSubmission | null;
    if (!submission) return null;
    // Kiriman yang sudah jadi data jemaat diperlakukan sebagai orangnya.
    const { data } = await supabase.from(TABLES.people).select(PERSON_COLUMNS).eq("submission_id", target.id).maybeSingle();
    person = data as PersonRow | null;
  }

  if (person?.life_group_id) return null;

  const effective: AssignTarget = person ? { kind: "person", id: person.id } : target;
  const wish = submission?.life_group ?? null;
  const groups = await groupChoices(segmentFromLabel(wish));

  const html = newMemberMessage({
    name: person?.full_name ?? submission!.name,
    phone: person?.phone ?? submission?.phone,
    area: person?.area ?? submission?.domicile,
    wish,
    note: submission?.age_range ? `Usia: ${submission.age_range}` : null,
    source,
  });

  const buttons = groups.map((group) => ({ text: group.name, callback_data: encodeAssign(effective, group.id) }));
  const keyboard: InlineKeyboard = { inline_keyboard: [...rows(buttons, 2), adminButton(effective)].filter((row) => row.length) };
  if (!groups.length) {
    return { html: `${html}\n\n<i>Belum ada Life Group aktif. Buat dulu di admin panel.</i>`, keyboard };
  }
  return { html, keyboard };
}

/** Kiriman Contact Us → data jemaat (status baru). Tidak membuat dobel. */
async function personFromSubmission(submissionId: string, by: string) {
  const supabase = db();
  const { data: existing } = await supabase.from(TABLES.people).select(PERSON_COLUMNS).eq("submission_id", submissionId).maybeSingle();
  if (existing) return existing as PersonRow;

  const { data: sub } = await supabase.from(TABLES.submissions).select("*").eq("id", submissionId).eq("form", "lifeGroup").maybeSingle();
  const submission = sub as ContactSubmission | null;
  if (!submission) return null;

  // Orang yang sama mungkin sudah dicatat admin secara manual: cocokkan nomor WA.
  const digits = phoneDigits(submission.phone);
  const { data: candidates } = await supabase.from(TABLES.people).select(PERSON_COLUMNS).not("phone", "is", null).limit(5000);
  const match = ((candidates ?? []) as PersonRow[]).find((p) => p.phone && phoneDigits(p.phone) === digits);
  if (match) {
    if (!match.submission_id) await supabase.from(TABLES.people).update({ submission_id: submissionId }).eq("id", match.id);
    return match;
  }

  const { data: created, error } = await supabase
    .from(TABLES.people)
    .insert({
      full_name: submission.name.trim(),
      phone: submission.phone,
      gender: submission.gender === "Perempuan" ? "P" : submission.gender?.startsWith("Laki") ? "L" : null,
      area: submission.domicile,
      status: "baru",
      submission_id: submission.id,
      notes: [submission.age_range && `Usia: ${submission.age_range}`, submission.life_group && `Ingin gabung Life Group ${submission.life_group}`]
        .filter(Boolean)
        .join("\n") || null,
      edited_by: `Telegram: ${by}`,
    })
    .select(PERSON_COLUMNS)
    .single();
  if (error) {
    console.error("[telegram] personFromSubmission:", error.message);
    return null;
  }
  return created as PersonRow;
}

export type AssignResult = {
  /** Teks singkat untuk answerCallbackQuery. */
  toast: string;
  /** Isi baru pesan; null = pesan tidak diubah. */
  html: string | null;
  keyboard?: InlineKeyboard;
};

/** Masukkan orang ke Life Group dari tombol Telegram. Tidak pernah memindahkan orang yang sudah punya grup. */
export async function assignFromTelegram(target: AssignTarget, groupId: string, by: string): Promise<AssignResult> {
  const supabase = db();
  const { data: group } = await supabase.from(TABLES.lifeGroups).select("id, name, is_active").eq("id", groupId).maybeSingle();
  if (!group?.is_active) return { toast: "Life Group ini tidak aktif lagi.", html: null };

  let person: PersonRow | null;
  if (target.kind === "submission") {
    person = await personFromSubmission(target.id, by);
  } else {
    const { data } = await supabase.from(TABLES.people).select(PERSON_COLUMNS).eq("id", target.id).maybeSingle();
    person = data as PersonRow | null;
  }
  if (!person) return { toast: "Data jemaat tidak ditemukan.", html: null };

  if (person.life_group_id) {
    const { data: current } = await supabase.from(TABLES.lifeGroups).select("name").eq("id", person.life_group_id).maybeSingle();
    const where = current?.name ?? "Life Group lain";
    return {
      toast: `Sudah masuk ${where}.`,
      html: `ℹ️ <b>${escapeHtml(person.full_name)}</b> sudah masuk <b>${escapeHtml(where)}</b>.`,
      keyboard: { inline_keyboard: [adminButton({ kind: "person", id: person.id })].filter((row) => row.length) },
    };
  }

  // Penjaga balapan: hanya berhasil kalau orangnya masih belum punya grup.
  const { data: updated, error } = await supabase
    .from(TABLES.people)
    .update({ life_group_id: group.id, life_group_role: "anggota", edited_by: `Telegram: ${by}` })
    .eq("id", person.id)
    .is("life_group_id", null)
    .select("id");
  if (error || !updated?.length) {
    if (error) console.error("[telegram] assign:", error.message);
    return { toast: "Gagal menyimpan. Mungkin sudah di-assign orang lain, coba /jemaatbaru lagi.", html: null };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/life-group");
  revalidatePath(`/admin/life-group/${group.id}`);
  revalidatePath("/admin/jemaat");
  revalidatePath(`/admin/jemaat/${person.id}`);

  const notice = await leaderNotice(supabase, person.id);
  const buttons: InlineButton[][] = [];
  if (notice?.notify) buttons.push([{ text: notice.notify.label, url: notice.notify.href }]);
  const admin = adminButton({ kind: "person", id: person.id });
  if (admin.length) buttons.push(admin);

  return {
    toast: `Masuk ke ${group.name}.`,
    html: [
      `✅ <b>${escapeHtml(person.full_name)}</b> masuk ke <b>${escapeHtml(group.name)}</b>.`,
      `Oleh ${escapeHtml(by)} lewat Telegram.`,
      notice?.notify ? "\nJangan lupa kabari leader-nya ya." : "\n<i>Grup ini belum punya leader dengan nomor WA.</i>",
    ].join("\n"),
    keyboard: { inline_keyboard: buttons },
  };
}
