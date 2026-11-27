import "server-only";

import { TABLES, type LgMaterial } from "@/lib/db-types";
import type { LeaderContext } from "@/lib/leader-auth";
import { nextOccurrence } from "@/lib/schedule";
import { toWibInput } from "@/lib/utils";

/**
 * Materi yang terbit untuk grup leader ini: materi untuk semua grup, ditambah
 * materi khusus segmen grupnya (Family, Young Professional, Youth).
 */
export async function groupMaterials(context: LeaderContext) {
  let query = context.supabase
    .from(TABLES.lgMaterials)
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false });
  // segment berasal dari database (enum yang dicek constraint), bukan dari input pengguna.
  query = context.lifeGroup.segment
    ? query.or(`segment.is.null,segment.eq.${context.lifeGroup.segment}`)
    : query.is("segment", null);
  const { data, error } = await query;
  return { materials: (data ?? []) as LgMaterial[], error };
}

/** Satu materi, hanya bila memang boleh dibuka grup ini. */
export async function groupMaterial(context: LeaderContext, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await context.supabase.from(TABLES.lgMaterials).select("*").eq("id", id).eq("published", true).maybeSingle();
  const material = data as LgMaterial | null;
  if (!material) return null;
  if (material.segment && material.segment !== context.lifeGroup.segment) return null;
  return material;
}

/** Jadwal rutin berikutnya sebagai nilai datetime-local, untuk mengisi form pertemuan baru. */
export function nextRegularMeeting(context: LeaderContext, now = new Date()) {
  const { meeting_day: day, meeting_time: time } = context.lifeGroup;
  if (day === null || !time) return undefined;
  return toWibInput(nextOccurrence({ kind: "weekly", weekday: day }, time.slice(0, 5), now).toISOString());
}
