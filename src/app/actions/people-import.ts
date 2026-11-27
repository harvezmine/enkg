"use server";

import { revalidatePath } from "next/cache";

import { adminDb } from "@/lib/admin-auth";
import { TABLES, type LifeGroup, type Relationship, type Team } from "@/lib/db-types";
import { todayWib } from "@/lib/people";
import { selectAll } from "@/lib/people-data";
import {
  findExisting,
  matchByName,
  nameKey,
  parseRow,
  sanitizeRaw,
  type Existing,
  type ImportValues,
} from "@/lib/people-import";

/*
 * Impor jemaat dari Excel, dikirim browser per kelompok (paling banyak
 * BATCH baris). Semua baris dibaca ulang dengan parseRow di sini: pratinjau
 * di browser hanya untuk kenyamanan, bukan sumber kebenaran.
 */

const BATCH = 250;
const EDITED_BY = "Impor Excel";

export type RowOutcome = {
  line: number;
  outcome: "added" | "updated" | "skipped" | "failed";
  personId?: string;
  message?: string;
  spouse?: string | null;
  marriedOn?: string | null;
};

export type BatchResult = { ok: boolean; message?: string; results: RowOutcome[] };

/**
 * Kolom yang diisi saja; kolom kosong di file tidak menghapus data lama.
 * Nama hanya ikut diperbarui bila barisnya cocok lewat kolom ID (file hasil
 * ekspor). Baris yang cocok lewat nomor WA bisa saja ditulis "Pak Budi".
 */
function personPayload(values: ImportValues, group: LifeGroup | null, forUpdate: boolean, keepName = false) {
  const payload: Record<string, unknown> = {
    full_name: values.full_name,
    nickname: values.nickname,
    gender: values.gender,
    birth_place: values.birth_place,
    birth_date: values.birth_date,
    phone: values.phone,
    email: values.email,
    address: values.address,
    area: values.area,
    occupation: values.occupation,
    joined_on: values.joined_on,
    baptized_on: values.baptized_on,
    notes: values.notes,
  };
  if (forUpdate) {
    for (const key of Object.keys(payload)) if (payload[key] === null) delete payload[key];
    if (keepName) delete payload.full_name;
    if (values.status_given) payload.status = values.status;
  } else {
    payload.status = values.status;
  }
  if (group) {
    payload.life_group_id = group.id;
    payload.life_group_role = values.life_group_role;
  }
  payload.edited_by = EDITED_BY;
  return payload;
}

export async function importPeopleBatch(input: string): Promise<BatchResult> {
  const supabase = await adminDb();

  let parsed: { rows?: unknown; onDuplicate?: unknown };
  try {
    parsed = JSON.parse(input);
  } catch {
    return { ok: false, message: "Data impor rusak. Muat ulang halaman lalu coba lagi.", results: [] };
  }
  const update = parsed.onDuplicate === "update";
  const rows = Array.isArray(parsed.rows) ? parsed.rows.slice(0, BATCH) : [];
  if (!rows.length) return { ok: false, message: "Tidak ada baris untuk diimpor.", results: [] };

  const [people, groups, teams] = await Promise.all([
    selectAll<Existing>((from, to) =>
      supabase.from(TABLES.people).select("id, full_name, phone, birth_date").order("id").range(from, to),
    ),
    supabase.from(TABLES.lifeGroups).select("*"),
    supabase.from(TABLES.teams).select("*"),
  ]);
  if (people.error || groups.error || teams.error) {
    return { ok: false, message: "Belum bisa membaca database. Coba lagi sebentar.", results: [] };
  }

  const existing = [...people.data];
  const today = todayWib();
  const results: RowOutcome[] = [];
  const memberships: { team_id: string; person_id: string; role: string | null }[] = [];

  for (const item of rows) {
    const entry = item as { line?: unknown; raw?: unknown };
    const line = Number.isInteger(entry.line) ? (entry.line as number) : 0;
    const row = parseRow(sanitizeRaw(entry.raw), line, today);
    const error = row.issues.find((issue) => issue.level === "error");
    if (error) {
      results.push({ line, outcome: "failed", message: error.message });
      continue;
    }

    const values = row.values;
    const group = matchByName(values.life_group, (groups.data ?? []) as LifeGroup[]);
    const match = findExisting(values, existing);

    let personId: string;
    let outcome: RowOutcome["outcome"];
    if (match && !update) {
      results.push({ line, outcome: "skipped", personId: match.id, message: `Sudah ada: ${match.full_name}`, spouse: values.spouse, marriedOn: values.married_on });
      continue;
    }

    if (match) {
      const { error: updateError } = await supabase
        .from(TABLES.people)
        .update(personPayload(values, group, true, values.id !== match.id))
        .eq("id", match.id);
      if (updateError) {
        console.error("[impor] update:", updateError);
        results.push({ line, outcome: "failed", message: "Gagal memperbarui" });
        continue;
      }
      personId = match.id;
      outcome = "updated";
    } else {
      personId = crypto.randomUUID();
      const { error: insertError } = await supabase.from(TABLES.people).insert({ id: personId, ...personPayload(values, group, false) });
      if (insertError) {
        console.error("[impor] insert:", insertError);
        results.push({ line, outcome: "failed", message: "Gagal menyimpan" });
        continue;
      }
      outcome = "added";
      // Baris berikutnya di kelompok yang sama ikut melihat orang baru ini.
      existing.push({ id: personId, full_name: values.full_name, phone: values.phone, birth_date: values.birth_date });
    }

    for (const { team: teamName, role } of values.teams) {
      const team = matchByName(teamName, (teams.data ?? []) as Team[]);
      if (team) memberships.push({ team_id: team.id, person_id: personId, role });
    }
    results.push({ line, outcome, personId, spouse: values.spouse, marriedOn: values.married_on });
  }

  if (memberships.length) {
    const { error } = await supabase.from(TABLES.teamMembers).upsert(memberships, { onConflict: "team_id,person_id" });
    if (error) console.error("[impor] pelayanan:", error);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/jemaat");
  revalidatePath("/admin/life-group");
  revalidatePath("/admin/pelayanan");
  return { ok: true, results };
}

/**
 * Langkah terakhir impor: hubungkan pasangan. Nama pasangan dicari di seluruh
 * database (termasuk yang baru diimpor) dan hanya dipakai bila cocok dengan
 * tepat satu orang.
 */
export async function linkImportedSpouses(
  input: string,
): Promise<{ linked: number; problems: { line: number; message: string }[] }> {
  const supabase = await adminDb();
  let pairs: { line: number; personId: string; spouse: string; marriedOn: string | null }[] = [];
  try {
    const data = JSON.parse(input);
    if (Array.isArray(data)) {
      pairs = data
        .filter((p) => p && typeof p.personId === "string" && typeof p.spouse === "string")
        .slice(0, 2000)
        .map((p) => ({
          line: Number(p.line) || 0,
          personId: String(p.personId).slice(0, 40),
          spouse: String(p.spouse).slice(0, 160),
          marriedOn: typeof p.marriedOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.marriedOn) ? p.marriedOn : null,
        }));
    }
  } catch {
    return { linked: 0, problems: [] };
  }
  if (!pairs.length) return { linked: 0, problems: [] };

  const [people, relationships] = await Promise.all([
    selectAll<Existing>((from, to) => supabase.from(TABLES.people).select("id, full_name, phone, birth_date").order("id").range(from, to)),
    selectAll<Relationship>((from, to) => supabase.from(TABLES.relationships).select("*").order("id").range(from, to)),
  ]);
  const ids = new Set(people.data.map((p) => p.id));
  const byName = new Map<string, string[]>();
  for (const person of people.data) {
    const key = nameKey(person.full_name);
    byName.set(key, [...(byName.get(key) ?? []), person.id]);
  }
  const pairKey = (a: string, b: string) => [a, b].sort().join("|");
  const known = new Map(relationships.data.map((rel) => [pairKey(rel.person_id, rel.relative_id), rel]));

  let linked = 0;
  const problems: { line: number; message: string }[] = [];
  for (const pair of pairs) {
    if (!ids.has(pair.personId)) continue;
    const matches = (byName.get(nameKey(pair.spouse)) ?? []).filter((id) => id !== pair.personId);
    if (matches.length !== 1) {
      problems.push({
        line: pair.line,
        message: matches.length ? `Ada beberapa "${pair.spouse}", hubungkan manual` : `Pasangan "${pair.spouse}" tidak ditemukan`,
      });
      continue;
    }
    const spouseId = matches[0]!;
    const current = known.get(pairKey(pair.personId, spouseId));
    if (current) {
      if (current.kind !== "pasangan") {
        problems.push({ line: pair.line, message: `Sudah tercatat sebagai keluarga lain dengan "${pair.spouse}"` });
      } else if (pair.marriedOn && current.married_on !== pair.marriedOn) {
        await supabase.from(TABLES.relationships).update({ married_on: pair.marriedOn }).eq("id", current.id);
        current.married_on = pair.marriedOn;
      }
      continue;
    }
    const { data, error } = await supabase
      .from(TABLES.relationships)
      .insert({ person_id: pair.personId, relative_id: spouseId, kind: "pasangan", married_on: pair.marriedOn })
      .select("*")
      .single();
    if (error || !data) {
      problems.push({ line: pair.line, message: `Gagal menghubungkan dengan "${pair.spouse}"` });
      continue;
    }
    known.set(pairKey(pair.personId, spouseId), data as Relationship);
    linked++;
  }

  revalidatePath("/admin/jemaat");
  return { linked, problems };
}
