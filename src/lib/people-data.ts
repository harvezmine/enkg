import "server-only";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import {
  PEOPLE_BUCKET,
  TABLES,
  type LifeGroup,
  type Person,
  type Relationship,
  type Team,
  type TeamMember,
} from "./db-types";

/** Umur signed URL foto jemaat. Halaman admin dirender ulang tiap dibuka. */
const PHOTO_URL_TTL = 60 * 60;
/** Batas baris per permintaan Supabase (max_rows). */
const PAGE = 1000;

type Page<T> = PromiseLike<{ data: T[] | null; error: PostgrestError | null }>;

/** Ambil semua baris, per 1000, supaya tidak terpotong diam-diam di batas max_rows. */
export async function selectAll<T>(page: (from: number, to: number) => Page<T>) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) return { data: rows, error };
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return { data: rows, error: null };
  }
}

const byName = (a: Person, b: Person) => a.full_name.localeCompare(b.full_name, "id", { sensitivity: "base" });

/**
 * Seluruh database jemaat dalam satu kali muat. Jumlah jemaat satu gereja
 * lokal cukup kecil (ratusan), jadi filter dan pencarian dikerjakan di server
 * Next.js, bukan lewat query PostgREST satu per satu.
 */
export async function loadDirectory(supabase: SupabaseClient) {
  const [people, relationships, members, teams, lifeGroups] = await Promise.all([
    selectAll<Person>((from, to) => supabase.from(TABLES.people).select("*").order("id").range(from, to)),
    selectAll<Relationship>((from, to) => supabase.from(TABLES.relationships).select("*").order("id").range(from, to)),
    selectAll<TeamMember>((from, to) => supabase.from(TABLES.teamMembers).select("*").order("id").range(from, to)),
    supabase.from(TABLES.teams).select("*").order("sort_order").order("name"),
    supabase.from(TABLES.lifeGroups).select("*").order("name"),
  ]);

  return {
    people: people.data.sort(byName),
    relationships: relationships.data,
    members: members.data,
    teams: (teams.data ?? []) as Team[],
    lifeGroups: (lifeGroups.data ?? []) as LifeGroup[],
    error: people.error ?? relationships.error ?? members.error ?? teams.error ?? lifeGroups.error,
  };
}

export type Directory = Awaited<ReturnType<typeof loadDirectory>>;

/** path foto → signed URL, dalam satu permintaan untuk semua foto. */
export async function signPhotos(supabase: SupabaseClient, paths: (string | null | undefined)[]) {
  const unique = [...new Set(paths.filter((path): path is string => Boolean(path)))];
  const urls = new Map<string, string>();
  if (!unique.length) return urls;

  const { data, error } = await supabase.storage.from(PEOPLE_BUCKET).createSignedUrls(unique, PHOTO_URL_TTL);
  if (error) {
    console.error("[jemaat] signPhotos:", error);
    return urls;
  }
  for (const item of data) if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  return urls;
}

export async function signPhoto(supabase: SupabaseClient, path: string) {
  const { data } = await supabase.storage.from(PEOPLE_BUCKET).createSignedUrl(path, PHOTO_URL_TTL);
  return data?.signedUrl ?? null;
}

/* ── Bentuk data untuk kartu & pemilih orang ─────────────────────────────── */

/** Peta-peta yang dipakai berulang oleh halaman jemaat, pelayanan, dan Life Group. */
export function indexDirectory(dir: Directory) {
  const peopleById = new Map(dir.people.map((person) => [person.id, person]));
  const teamsById = new Map(dir.teams.map((team) => [team.id, team]));
  const groupsById = new Map(dir.lifeGroups.map((group) => [group.id, group]));
  const membershipsByPerson = new Map<string, TeamMember[]>();
  for (const member of dir.members) {
    const list = membershipsByPerson.get(member.person_id) ?? [];
    list.push(member);
    membershipsByPerson.set(member.person_id, list);
  }
  return { peopleById, teamsById, groupsById, membershipsByPerson };
}

export type DirectoryIndex = ReturnType<typeof indexDirectory>;

/** Pelayanan seseorang sebagai chip kartu, urut sesuai urutan tim. */
export function teamChips(personId: string, index: DirectoryIndex) {
  return (index.membershipsByPerson.get(personId) ?? [])
    .flatMap((member) => {
      const team = index.teamsById.get(member.team_id);
      return team ? [{ label: team.name, lead: member.is_lead, order: team.sort_order }] : [];
    })
    .sort((a, b) => a.order - b.order)
    .map(({ label, lead }) => ({ label, lead }));
}
