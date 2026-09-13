import type { FormKey } from "@/lib/google-forms";

/** Baris enkg_contact_submissions dari isian form yang sudah lolos validasi. */
export function toSubmissionRow(form: FormKey, values: Record<string, string | undefined>) {
  const get = (key: string) => (values[key] ?? "").trim() || null;
  return {
    form,
    name: get("name") ?? "",
    gender: get("gender"),
    phone: (values.phone ?? "").replace(/[\s-]/g, ""),
    domicile: form === "lifeGroup" ? get("domicile") : null,
    age_range: form === "lifeGroup" ? get("ageRange") : null,
    life_group: form === "lifeGroup" ? get("group") : null,
    request: form === "prayer" ? get("request") : null,
  };
}
