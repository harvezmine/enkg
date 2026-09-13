"use server";

import { TABLES } from "@/lib/db-types";
import { buildSubmission, FORMS, isFormKey, type FormKey } from "@/lib/google-forms";
import { toSubmissionRow } from "@/lib/submissions";
import { createAdminClient } from "@/lib/supabase/admin";

export type ConnectState = {
  status: "idle" | "success" | "error";
  message?: string;
  /** Error per field, dipakai untuk menandai input yang bermasalah. */
  fieldErrors?: Record<string, string>;
  /** React 19 mengosongkan form setelah action selesai, jadi isian dikembalikan agar tidak hilang. */
  values?: Record<string, string>;
};

/** Simpan ke database supaya muncul di admin panel (menu Contact Us). */
async function saveToDatabase(form: FormKey, values: Record<string, string>) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
  try {
    const { error } = await createAdminClient().from(TABLES.submissions).insert(toSubmissionRow(form, values));
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("[connect] gagal menyimpan ke database:", error);
    return false;
  }
}

/** Teruskan ke Google Form gereja, supaya Google Sheet yang sudah dipakai tim tetap terisi. */
async function sendToGoogleForm(form: FormKey, body: URLSearchParams) {
  try {
    const res = await fetch(FORMS[form].action, {
      method: "POST",
      body,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    // Google Forms membalas 200 (atau redirect) bila jawaban tercatat.
    if (res.status >= 400) throw new Error(`Google Forms membalas HTTP ${res.status}`);
    return true;
  } catch (error) {
    console.error("[connect] gagal mengirim ke Google Forms:", error);
    return false;
  }
}

/**
 * Menerima isian form Contact Us (Life Group / Permohonan Doa).
 * Disimpan ke database admin panel DAN diteruskan ke Google Form. Pengunjung
 * mendapat konfirmasi berhasil bila setidaknya satu tujuan menerima isiannya.
 */
export async function submitConnect(_prev: ConnectState, formData: FormData): Promise<ConnectState> {
  // Honeypot: bot mengisi field tersembunyi ini, manusia tidak.
  if (String(formData.get("website") ?? "").trim()) return { status: "success" };

  const form = formData.get("form");
  if (!isFormKey(form)) return { status: "error", message: "Formulir tidak dikenal." };

  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$") && key !== "website") values[key] = value;
  }

  const submission = buildSubmission(form, values);
  if (!submission.ok) {
    return {
      status: "error",
      message: "Mohon lengkapi isian yang ditandai.",
      fieldErrors: submission.fieldErrors,
      values,
    };
  }

  const [saved, sent] = await Promise.all([saveToDatabase(form, values), sendToGoogleForm(form, submission.body)]);

  if (!saved && !sent) {
    return {
      status: "error",
      message: "Maaf, formulir belum terkirim. Coba lagi sebentar lagi atau hubungi kami lewat WhatsApp.",
      values,
    };
  }

  return { status: "success" };
}
