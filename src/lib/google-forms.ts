/**
 * Formulir situs mengirim langsung ke Google Form yang sudah dipakai gereja,
 * jadi jawaban tetap masuk ke Google Sheet yang sama dan tim tidak perlu
 * mengubah kebiasaan. Entry ID & teks opsi diambil dari form aslinya
 * (lihat resources/google-forms.json) dan HARUS sama persis.
 */
export const GENDERS = ["Laki-Laki", "Perempuan"] as const;
export const DOMICILES = ["Jakarta", "Luar Jakarta"] as const;
export const AGE_RANGES = [
  "12 - 17 Tahun",
  "18 - 25 Tahun",
  "26 - 35 Tahun",
  "36 - 45 Tahun",
  "46 Tahun ke atas",
] as const;
export const LIFE_GROUPS = ["Family", "Young Professional", "Youth"] as const;

type FieldSpec = { entry: string; label: string; options?: readonly string[]; max?: number; phone?: boolean };
type FormSpec = { action: string; fields: Record<string, FieldSpec> };

const NAME: FieldSpec = { entry: "entry.45587488", label: "Nama", max: 120 };
const GENDER: FieldSpec = { entry: "entry.1212948792", label: "Jenis kelamin", options: GENDERS };
const PHONE_FIELD: FieldSpec = { entry: "entry.733602486", label: "Nomor WhatsApp", phone: true };

export const FORMS = {
  lifeGroup: {
    action:
      "https://docs.google.com/forms/d/e/1FAIpQLSdj8YC0NoHAuaBHLq2gv2wmFgY9Iyj9ri2KSN2AFhh1Y0Ct2w/formResponse",
    fields: {
      name: NAME,
      gender: GENDER,
      phone: PHONE_FIELD,
      domicile: { entry: "entry.1242317519", label: "Domisili", options: DOMICILES },
      ageRange: { entry: "entry.1718285839", label: "Usia", options: AGE_RANGES },
      group: { entry: "entry.316669310", label: "Life Group", options: LIFE_GROUPS },
    },
  },
  prayer: {
    action:
      "https://docs.google.com/forms/d/e/1FAIpQLSf5k_QcPfYObbZVqynScOk2eWLjfXNxtBqzkODxVpDvljmPRw/formResponse",
    fields: {
      name: NAME,
      gender: GENDER,
      phone: PHONE_FIELD,
      request: { entry: "entry.1242317519", label: "Permohonan doa", max: 4000 },
    },
  },
} satisfies Record<string, FormSpec>;

export type FormKey = keyof typeof FORMS;

export type Submission =
  | { ok: true; body: URLSearchParams }
  | { ok: false; fieldErrors: Record<string, string> };

const PHONE = /^(?:\+?62|0)8\d{7,12}$/;

/** Dipakai juga di browser untuk validasi langsung sebelum form dikirim. */
export function isValidPhone(value: string): boolean {
  return PHONE.test(value.replace(/[\s-]/g, ""));
}

export function isFormKey(value: unknown): value is FormKey {
  return typeof value === "string" && Object.hasOwn(FORMS, value);
}

export function buildSubmission(form: FormKey, input: Record<string, string | undefined>): Submission {
  const fields: Record<string, FieldSpec> = FORMS[form].fields;
  const fieldErrors: Record<string, string> = {};
  const body = new URLSearchParams();

  for (const [name, spec] of Object.entries(fields)) {
    let value = (input[name] ?? "").trim().slice(0, spec.max ?? 200);
    if (spec.phone) value = value.replace(/[\s-]/g, "");

    if (!value) fieldErrors[name] = `${spec.label} wajib diisi.`;
    else if (spec.options && !spec.options.includes(value)) fieldErrors[name] = `Pilih ${spec.label.toLowerCase()}.`;
    else if (spec.phone && !PHONE.test(value)) fieldErrors[name] = "Nomor WhatsApp belum valid, contoh: 0812 3456 7890.";
    else body.set(spec.entry, value);
  }

  return Object.keys(fieldErrors).length ? { ok: false, fieldErrors } : { ok: true, body };
}
