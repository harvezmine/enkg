"use server";

import { buildSubmission, FORMS, isFormKey } from "@/lib/google-forms";

export type ConnectState = {
  status: "idle" | "success" | "error";
  message?: string;
  /** Error per field, dipakai untuk menandai input yang bermasalah. */
  fieldErrors?: Record<string, string>;
  /** React 19 mengosongkan form setelah action selesai — isian dikembalikan agar tidak hilang. */
  values?: Record<string, string>;
};

/**
 * Meneruskan isian form situs ke Google Form gereja (Life Group / Permohonan Doa).
 * Dikirim dari server, bukan dari browser, supaya tidak terhalang CORS dan
 * pengunjung tetap mendapat konfirmasi yang jelas.
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

  try {
    const res = await fetch(FORMS[form].action, {
      method: "POST",
      body: submission.body,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    // Google Forms membalas 200 (atau redirect) bila jawaban tercatat.
    if (res.status >= 400) throw new Error(`Google Forms membalas HTTP ${res.status}`);
  } catch (error) {
    console.error("[connect] gagal mengirim ke Google Forms:", error);
    return {
      status: "error",
      message: "Maaf, formulir belum terkirim. Coba lagi sebentar lagi atau hubungi kami lewat WhatsApp.",
      values,
    };
  }

  return { status: "success" };
}
