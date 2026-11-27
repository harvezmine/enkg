"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { schedule as staticSchedule } from "@/content/schedule";
import { adminDb } from "@/lib/admin-auth";
import { isCalendarDate, isClock } from "@/lib/calendar";
import { TABLES, type ScheduleCategory, type ScheduleRecurrence } from "@/lib/db-types";
import { bool, nullable, text } from "@/lib/form-data";

import type { ActionState } from "./admin";

/*
 * Kalender gereja. Jadwal ini tampil di halaman utama (Hero, Pelayanan, News,
 * Kalender), jadi setiap perubahan memperbarui "/" lewat revalidatePath.
 * Seperti aksi admin lain, klien diambil lewat adminDb() yang menolak
 * permintaan tanpa sesi admin.
 */

const CATEGORIES: ScheduleCategory[] = ["ibadah", "doa", "life_group", "lainnya"];
const RECURRENCES: ScheduleRecurrence[] = ["weekly", "monthly_nth", "once"];
const isUrl = (value: string) => value === "" || /^https?:\/\//i.test(value);

function refresh(id?: string) {
  revalidatePath("/");
  revalidatePath("/admin/kalender");
  if (id) revalidatePath(`/admin/kalender/${id}`);
}

export async function saveSchedule(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const id = text(fd, "id", 60);
  const title = text(fd, "title", 120);
  const category = text(fd, "category", 20) as ScheduleCategory;
  const recurrence = text(fd, "recurrence", 20) as ScheduleRecurrence;
  const weekday = Number.parseInt(text(fd, "weekday", 2), 10);
  const nth = Number.parseInt(text(fd, "nth", 2), 10);
  const onDate = text(fd, "on_date", 10);
  const start = text(fd, "start_time", 5);
  const end = text(fd, "end_time", 5);
  const mode = text(fd, "mode", 10) === "online" ? "online" : "onsite";
  const link = text(fd, "link_url", 600);
  const order = Number.parseInt(text(fd, "sort_order", 6), 10);

  if (title.length < 3) return { status: "error", message: "Nama jadwal terlalu pendek." };
  if (!CATEGORIES.includes(category)) return { status: "error", message: "Pilih jenis jadwalnya." };
  if (!RECURRENCES.includes(recurrence)) return { status: "error", message: "Pilih pola jadwalnya." };
  if (recurrence !== "once" && !(weekday >= 0 && weekday <= 6)) return { status: "error", message: "Pilih harinya." };
  if (recurrence === "monthly_nth" && !(nth >= 1 && nth <= 5)) return { status: "error", message: "Pilih minggu ke-berapa." };
  if (recurrence === "once" && !isCalendarDate(onDate)) return { status: "error", message: "Isi tanggalnya." };
  if (!isClock(start)) return { status: "error", message: "Jam mulai wajib diisi, contoh 10:00." };
  if (end && !isClock(end)) return { status: "error", message: "Format jam selesai tidak valid." };
  if (end && end <= start) return { status: "error", message: "Jam selesai harus setelah jam mulai." };
  if (!isUrl(link)) return { status: "error", message: "Tautan harus diawali http:// atau https://" };

  const payload = {
    title,
    category,
    recurrence,
    // Kolom yang tidak dipakai polanya dikosongkan, sesuai constraint di schema.sql.
    weekday: recurrence === "once" ? null : weekday,
    nth: recurrence === "monthly_nth" ? nth : null,
    on_date: recurrence === "once" ? onDate : null,
    start_time: start,
    end_time: nullable(end),
    place: nullable(text(fd, "place", 160)),
    mode,
    link_url: nullable(link),
    note: nullable(text(fd, "note", 300)),
    published: bool(fd, "published"),
    sort_order: Number.isFinite(order) ? order : 0,
  };

  const supabase = await adminDb();
  const { data, error } = id
    ? await supabase.from(TABLES.schedule).update(payload).eq("id", id).select("id").single()
    : await supabase.from(TABLES.schedule).insert(payload).select("id").single();

  if (error || !data) {
    console.error("[admin] saveSchedule:", error);
    return { status: "error", message: "Gagal menyimpan jadwal. Coba lagi sebentar." };
  }

  refresh(data.id);
  redirect("/admin/kalender?saved=1");
}

export async function toggleSchedule(fd: FormData) {
  const id = text(fd, "id", 60);
  const supabase = await adminDb();
  await supabase.from(TABLES.schedule).update({ published: bool(fd, "next") }).eq("id", id);
  refresh(id);
}

export async function deleteSchedule(fd: FormData) {
  const supabase = await adminDb();
  await supabase.from(TABLES.schedule).delete().eq("id", text(fd, "id", 60));
  refresh();
}

/**
 * Salin jadwal bawaan situs ke database, untuk database yang dibuat sebelum
 * seed kalender ada. Hanya jalan bila tabelnya masih kosong.
 */
export async function importDefaultSchedule() {
  const supabase = await adminDb();
  const { count } = await supabase.from(TABLES.schedule).select("id", { count: "exact", head: true });
  if (!count) {
    const rows = staticSchedule.map((item, index) => ({
      slug: item.id,
      title: item.title,
      category: item.category,
      recurrence: item.recurrence.kind === "weekly" ? "weekly" : "monthly_nth",
      weekday: item.recurrence.weekday,
      nth: item.recurrence.kind === "monthly-nth" ? item.recurrence.nth : null,
      start_time: item.start,
      end_time: item.end ?? null,
      place: item.place,
      mode: item.mode,
      link_url: item.href ?? null,
      note: item.note ?? null,
      sort_order: (index + 1) * 10,
    }));
    const { error } = await supabase.from(TABLES.schedule).insert(rows);
    if (error) console.error("[admin] importDefaultSchedule:", error);
  }
  refresh();
  redirect("/admin/kalender?saved=1");
}
