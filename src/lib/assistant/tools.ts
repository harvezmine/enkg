import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  EVENT_CATEGORY_LABEL,
  PERSON_STATUS_LABEL,
  SUBMISSION_STATUS_LABEL,
  TABLES,
  type ChurchEvent,
  type ContactSubmission,
  type LifeGroup,
  type Person,
  type Post,
  type ScheduleRow,
  type SubmissionStatus,
  type Team,
  type TeamMember,
} from "../db-types";
import { WEEKDAYS } from "../life-groups";
import { selectAll } from "../people-data";
import { formatDate, formatDateTime } from "../utils";
import { matchByName, parseWib } from "./match";
import {
  EVENT_COLUMNS,
  LIFE_GROUP_COLUMNS,
  PERSON_COLUMNS,
  PERSON_FILTER_COLUMNS,
  POST_COLUMNS,
  SUBMISSION_COLUMNS,
  TEAM_COLUMNS,
  eventOut,
  lifeGroupOut,
  memberOut,
  personOut,
  postOut,
  submissionOut,
  teamOut,
} from "./projections";
import type { Proposal } from "./proposals";

/*
 * Alat (function calling) asisten internal. Alat baca langsung dijalankan;
 * alat "usul_*" hanya menyiapkan usulan yang wajib dikonfirmasi admin.
 * Semua query memakai daftar kolom dari projections.ts.
 */

type Db = SupabaseClient;
type Args = Record<string, unknown>;
export type ToolResult = { forModel: unknown; proposal?: Proposal };

const str = (value: unknown, max = 200) => (typeof value === "string" ? value.trim().slice(0, max) : "");
type PersonLite = Pick<Person, "id" | "full_name" | "nickname" | "phone" | "life_group_id" | "life_group_role" | "status">;

async function loadPeople(db: Db) {
  const { data, error } = await selectAll<PersonLite>((from, to) =>
    db.from(TABLES.people).select(PERSON_FILTER_COLUMNS).order("id").range(from, to),
  );
  if (error) throw new Error("db");
  return data;
}

async function loadGroups(db: Db) {
  const { data, error } = await db.from(TABLES.lifeGroups).select(LIFE_GROUP_COLUMNS).order("name");
  if (error) throw new Error("db");
  return (data ?? []) as Pick<LifeGroup, "id" | "name" | "segment" | "meeting_day" | "meeting_time" | "area" | "is_active">[];
}

function scheduleText(row: ScheduleRow) {
  const time = row.start_time.slice(0, 5).replace(":", ".");
  if (row.recurrence === "once") return `${row.on_date ? formatDate(`${row.on_date}T00:00:00+07:00`) : "?"} ${time}`;
  const day = WEEKDAYS[row.weekday ?? 0];
  return row.recurrence === "monthly_nth" ? `${day} ke-${row.nth} tiap bulan ${time}` : `Setiap ${day} ${time}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Definisi alat untuk DeepSeek
   ═══════════════════════════════════════════════════════════════════════════ */

const fn = (name: string, description: string, properties: Record<string, unknown> = {}, required: string[] = []) => ({
  type: "function" as const,
  function: { name, description, parameters: { type: "object", properties, required } },
});

export const TOOL_DEFINITIONS = [
  fn("cari_jemaat", "Cari jemaat berdasarkan nama atau panggilan. Hanya memberi nama, panggilan, dan nomor WA.", { nama: { type: "string" } }, ["nama"]),
  fn("jemaat_menunggu_life_group", "Daftar jemaat baru yang belum punya Life Group (nama dan WA)."),
  fn("ringkasan_jemaat", "Jumlah jemaat per status, yang sudah/belum punya Life Group, dan jumlah pelayan. Hanya angka."),
  fn("daftar_life_group", "Semua Life Group: kelompok, jadwal, wilayah, jumlah anggota, leader."),
  fn("anggota_life_group", "Anggota satu Life Group (nama, WA, peran).", { nama_grup: { type: "string" } }, ["nama_grup"]),
  fn("tim_pelayanan", "Tim pelayanan dan anggotanya (nama, WA, peran). Kosongkan nama_tim untuk semua tim.", { nama_tim: { type: "string" } }),
  fn("jadwal_rutin", "Jadwal rutin gereja di kalender (ibadah, doa, dll)."),
  fn(
    "daftar_event",
    "Event gereja dan ProCon.",
    { filter: { type: "string", enum: ["mendatang", "semua", "draf"] } },
  ),
  fn("daftar_news", "Kabar & artikel terbaru (judul, status terbit, tanggal).", { jumlah: { type: "integer", minimum: 1, maximum: 20 } }),
  fn(
    "kiriman_contact_us",
    "Kiriman form Contact Us (nama, WA, jenis, status, tanggal). Isi permohonan doa tidak tersedia.",
    {
      status: { type: "string", enum: ["baru", "dihubungi", "selesai", "semua"] },
      jenis: { type: "string", enum: ["lifeGroup", "prayer", "semua"] },
      hari: { type: "integer", minimum: 1, maximum: 365, description: "Hanya kiriman N hari terakhir" },
    },
  ),
  fn(
    "usul_draf_news",
    "Siapkan draf News (belum terbit). Admin harus menekan Jalankan dulu.",
    {
      judul: { type: "string" },
      isi: { type: "string", description: "Isi tulisan. Pisahkan paragraf dengan baris kosong." },
      ringkasan: { type: "string" },
      kategori: { type: "string", enum: ["kabar", "artikel"] },
    },
    ["judul", "isi"],
  ),
  fn(
    "usul_event",
    "Siapkan event gereja baru (draf kecuali diminta terbit). Admin harus menekan Jalankan dulu.",
    {
      nama: { type: "string" },
      mulai: { type: "string", description: "Tanggal & jam WIB, format YYYY-MM-DD HH:MM" },
      selesai: { type: "string", description: "Opsional, format YYYY-MM-DD HH:MM" },
      lokasi: { type: "string" },
      alamat: { type: "string" },
      deskripsi: { type: "string" },
      kategori: { type: "string", enum: ["gereja", "procon"] },
      terbitkan: { type: "boolean" },
    },
    ["nama", "mulai"],
  ),
  fn(
    "usul_masukkan_life_group",
    "Siapkan memasukkan seorang jemaat ke Life Group sebagai anggota. Admin harus menekan Jalankan dulu.",
    { nama_jemaat: { type: "string" }, nama_grup: { type: "string" } },
    ["nama_jemaat", "nama_grup"],
  ),
  fn(
    "usul_status_kiriman",
    "Siapkan perubahan status kiriman Contact Us. Pakai id dari kiriman_contact_us kalau ada. Admin harus menekan Jalankan dulu.",
    {
      id_kiriman: { type: "string" },
      nama: { type: "string", description: "Nama pengirim, kalau id tidak ada" },
      status: { type: "string", enum: ["baru", "dihubungi", "selesai"] },
    },
    ["status"],
  ),
];

/** Kalimat status singkat di UI selama alat berjalan. */
export const TOOL_STATUS: Record<string, string> = {
  cari_jemaat: "Mencari jemaat…",
  jemaat_menunggu_life_group: "Melihat antrean Life Group…",
  ringkasan_jemaat: "Menghitung data jemaat…",
  daftar_life_group: "Membuka Life Group…",
  anggota_life_group: "Membuka anggota Life Group…",
  tim_pelayanan: "Membuka tim pelayanan…",
  jadwal_rutin: "Membuka kalender…",
  daftar_event: "Membuka event…",
  daftar_news: "Membuka News…",
  kiriman_contact_us: "Membuka Contact Us…",
  usul_draf_news: "Menyiapkan draf…",
  usul_event: "Menyiapkan event…",
  usul_masukkan_life_group: "Menyiapkan usulan…",
  usul_status_kiriman: "Menyiapkan usulan…",
};

/* ═══════════════════════════════════════════════════════════════════════════
   Pelaksana alat
   ═══════════════════════════════════════════════════════════════════════════ */

export async function runTool(db: Db, name: string, args: Args): Promise<ToolResult> {
  switch (name) {
    case "cari_jemaat": {
      const people = await loadPeople(db);
      const found = matchByName(people, str(args.nama, 80), (p) => [p.full_name, p.nickname]).slice(0, 10);
      return { forModel: { jumlah: found.length, jemaat: found.map(personOut) } };
    }

    case "jemaat_menunggu_life_group": {
      const people = (await loadPeople(db)).filter((p) => p.status === "baru" && !p.life_group_id);
      return { forModel: { jumlah: people.length, jemaat: people.slice(0, 50).map(personOut), buka: "/admin/life-group" } };
    }

    case "ringkasan_jemaat": {
      const people = await loadPeople(db);
      const { data: members } = await db.from(TABLES.teamMembers).select("person_id");
      const byStatus = Object.fromEntries(
        Object.entries(PERSON_STATUS_LABEL).map(([key, label]) => [label, people.filter((p) => p.status === key).length]),
      );
      return {
        forModel: {
          total: people.length,
          per_status: byStatus,
          punya_life_group: people.filter((p) => p.life_group_id).length,
          belum_punya_life_group: people.filter((p) => !p.life_group_id).length,
          pelayan: new Set((members ?? []).map((m) => m.person_id)).size,
        },
      };
    }

    case "daftar_life_group": {
      const [groups, people] = await Promise.all([loadGroups(db), loadPeople(db)]);
      return {
        forModel: groups.map((group) => {
          const members = people.filter((p) => p.life_group_id === group.id);
          return {
            ...lifeGroupOut(group),
            jumlah_anggota: members.length,
            leader: members.filter((p) => p.life_group_role === "leader").map((p) => personOut(p)),
            admin: `/admin/life-group/${group.id}`,
          };
        }),
      };
    }

    case "anggota_life_group": {
      const groups = await loadGroups(db);
      const found = matchByName(groups, str(args.nama_grup, 80), (g) => [g.name]);
      if (found.length !== 1) {
        return { forModel: { error: found.length ? "Nama grup kurang jelas" : "Grup tidak ditemukan", kandidat: found.map((g) => g.name) } };
      }
      const group = found[0]!;
      const { data } = await db
        .from(TABLES.people)
        .select(`${PERSON_COLUMNS}, life_group_role`)
        .eq("life_group_id", group.id)
        .order("full_name");
      const members = (data ?? []) as (Pick<Person, "id" | "full_name" | "nickname" | "phone" | "life_group_role">)[];
      return { forModel: { grup: lifeGroupOut(group), jumlah: members.length, anggota: members.map(memberOut), admin: `/admin/life-group/${group.id}` } };
    }

    case "tim_pelayanan": {
      const [{ data: teams }, { data: memberships }, people] = await Promise.all([
        db.from(TABLES.teams).select(TEAM_COLUMNS).order("sort_order"),
        db.from(TABLES.teamMembers).select("team_id, person_id, role, is_lead"),
        loadPeople(db),
      ]);
      const byId = new Map(people.map((p) => [p.id, p]));
      let list = (teams ?? []) as Pick<Team, "id" | "name" | "description">[];
      const wanted = str(args.nama_tim, 60);
      if (wanted) list = matchByName(list, wanted, (t) => [t.name]);
      return {
        forModel: list.map((team) =>
          teamOut(
            team,
            ((memberships ?? []) as Pick<TeamMember, "team_id" | "person_id" | "role" | "is_lead">[])
              .filter((m) => m.team_id === team.id && byId.has(m.person_id))
              .map((m) => ({ nama: byId.get(m.person_id)!.full_name, wa: byId.get(m.person_id)!.phone, peran: m.role, koordinator: m.is_lead })),
          ),
        ),
      };
    }

    case "jadwal_rutin": {
      const { data } = await db
        .from(TABLES.schedule)
        .select("title, category, recurrence, weekday, nth, on_date, start_time, end_time, place, mode, published")
        .order("sort_order");
      return {
        forModel: ((data ?? []) as ScheduleRow[]).map((row) => ({
          judul: row.title,
          kapan: scheduleText(row),
          tempat: row.mode === "online" ? "Online" : (row.place ?? null),
          tampil_di_situs: row.published,
        })),
      };
    }

    case "daftar_event": {
      const filter = str(args.filter, 12) || "mendatang";
      let query = db.from(TABLES.events).select(EVENT_COLUMNS).order("starts_at", { ascending: filter === "mendatang", nullsFirst: false }).limit(30);
      if (filter === "mendatang") query = query.gte("starts_at", new Date().toISOString());
      if (filter === "draf") query = query.eq("published", false);
      const { data } = await query;
      return { forModel: ((data ?? []) as ChurchEvent[]).map(eventOut) };
    }

    case "daftar_news": {
      const limit = Math.min(20, Math.max(1, Number(args.jumlah) || 8));
      const { data } = await db.from(TABLES.posts).select(POST_COLUMNS).order("created_at", { ascending: false }).limit(limit);
      return { forModel: ((data ?? []) as Post[]).map(postOut) };
    }

    case "kiriman_contact_us": {
      let query = db.from(TABLES.submissions).select(SUBMISSION_COLUMNS).order("created_at", { ascending: false }).limit(50);
      const status = str(args.status, 12);
      const form = str(args.jenis, 12);
      const days = Number(args.hari);
      if (status in SUBMISSION_STATUS_LABEL) query = query.eq("status", status);
      if (form === "lifeGroup" || form === "prayer") query = query.eq("form", form);
      if (Number.isFinite(days) && days > 0) query = query.gte("created_at", new Date(Date.now() - days * 86_400_000).toISOString());
      const { data } = await query;
      const rows = (data ?? []) as ContactSubmission[];
      return { forModel: { jumlah: rows.length, kiriman: rows.map(submissionOut), buka: "/admin/kontak" } };
    }

    /* ── Usulan aksi (wajib konfirmasi) ─────────────────────────────────── */

    case "usul_draf_news": {
      const title = str(args.judul, 200);
      const body = str(args.isi, 20000);
      if (title.length < 3 || body.length < 10) return { forModel: { error: "Judul dan isi draf belum cukup." } };
      const category = args.kategori === "artikel" ? "artikel" : "kabar";
      return {
        forModel: { status: "Menunggu konfirmasi admin. Belum tersimpan." },
        proposal: {
          kind: "news_draft",
          summary: `Buat draf News “${title}”`,
          data: { title, body, category, excerpt: str(args.ringkasan, 400) || null },
        },
      };
    }

    case "usul_event": {
      const title = str(args.nama, 200);
      const startsAt = parseWib(str(args.mulai, 20));
      const endsRaw = str(args.selesai, 20);
      const endsAt = endsRaw ? parseWib(endsRaw) : null;
      if (title.length < 3) return { forModel: { error: "Nama event terlalu pendek." } };
      if (!startsAt) return { forModel: { error: "Format mulai harus YYYY-MM-DD HH:MM (WIB)." } };
      if (endsRaw && !endsAt) return { forModel: { error: "Format selesai harus YYYY-MM-DD HH:MM (WIB)." } };
      if (endsAt && endsAt <= startsAt) return { forModel: { error: "Jam selesai harus setelah jam mulai." } };
      const category = args.kategori === "procon" ? "procon" : "gereja";
      const publish = args.terbitkan === true;
      return {
        forModel: { status: "Menunggu konfirmasi admin. Belum tersimpan." },
        proposal: {
          kind: "event",
          summary: `Buat ${EVENT_CATEGORY_LABEL[category].toLowerCase()} “${title}”, ${formatDateTime(startsAt)}${publish ? ", langsung terbit" : " (draf)"}`,
          data: {
            title,
            category,
            starts_at: startsAt,
            ends_at: endsAt,
            location: str(args.lokasi, 200) || null,
            address: str(args.alamat, 400) || null,
            description: str(args.deskripsi, 20000) || null,
            published: publish,
          },
        },
      };
    }

    case "usul_masukkan_life_group": {
      const [people, groups] = await Promise.all([loadPeople(db), loadGroups(db)]);
      const persons = matchByName(people, str(args.nama_jemaat, 80), (p) => [p.full_name, p.nickname]);
      if (persons.length !== 1) {
        return {
          forModel: {
            error: persons.length ? "Ada beberapa jemaat dengan nama itu. Tanyakan yang mana." : "Jemaat tidak ditemukan.",
            kandidat: persons.slice(0, 8).map(personOut),
          },
        };
      }
      const active = groups.filter((g) => g.is_active);
      const found = matchByName(active, str(args.nama_grup, 80), (g) => [g.name]);
      if (found.length !== 1) {
        return { forModel: { error: found.length ? "Nama grup kurang jelas." : "Grup tidak ditemukan.", kandidat: found.map((g) => g.name) } };
      }
      const person = persons[0]!;
      const group = found[0]!;
      if (person.life_group_id === group.id) return { forModel: { error: `${person.full_name} sudah ada di ${group.name}.` } };
      const moving = person.life_group_id ? groups.find((g) => g.id === person.life_group_id)?.name : null;
      return {
        forModel: { status: "Menunggu konfirmasi admin. Belum tersimpan." },
        proposal: {
          kind: "assign_lg",
          summary: `Masukkan ${person.full_name} ke ${group.name}${moving ? ` (pindah dari ${moving})` : ""}`,
          data: { person_id: person.id, group_id: group.id },
        },
      };
    }

    case "usul_status_kiriman": {
      const status = str(args.status, 12) as SubmissionStatus;
      if (!(status in SUBMISSION_STATUS_LABEL)) return { forModel: { error: "Status harus baru, dihubungi, atau selesai." } };
      const id = str(args.id_kiriman, 60);
      let row: ContactSubmission | null = null;
      if (id) {
        const { data } = await db.from(TABLES.submissions).select(SUBMISSION_COLUMNS).eq("id", id).maybeSingle();
        row = data as ContactSubmission | null;
      } else {
        const { data } = await db.from(TABLES.submissions).select(SUBMISSION_COLUMNS).order("created_at", { ascending: false }).limit(200);
        const found = matchByName((data ?? []) as ContactSubmission[], str(args.nama, 80), (s) => [s.name]);
        if (found.length > 1) return { forModel: { error: "Ada beberapa kiriman dari nama itu.", kandidat: found.slice(0, 8).map(submissionOut) } };
        row = found[0] ?? null;
      }
      if (!row) return { forModel: { error: "Kiriman tidak ditemukan." } };
      return {
        forModel: { status: "Menunggu konfirmasi admin. Belum tersimpan." },
        proposal: {
          kind: "submission_status",
          summary: `Ubah status kiriman ${row.name} jadi “${SUBMISSION_STATUS_LABEL[status]}”`,
          data: { id: row.id, status },
        },
      };
    }

    default:
      return { forModel: { error: "Alat tidak dikenal." } };
  }
}
