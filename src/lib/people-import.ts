import { PERSON_STATUS_LABEL, type Gender, type LifeGroupRole, type PersonStatus } from "./db-types";
import { isValidDate, phoneDigits } from "./people";

/*
 * Impor data jemaat dari Excel/CSV. Modul ini murni (tanpa database) supaya
 * aturan yang sama dipakai dua kali: di browser untuk pratinjau, dan lagi di
 * server sebelum menyimpan, karena isi kiriman dari browser tidak dipercaya.
 */

export const MAX_IMPORT_ROWS = 2000;

export type ImportField =
  | "id"
  | "full_name"
  | "nickname"
  | "gender"
  | "birth_place"
  | "birth_date"
  | "phone"
  | "email"
  | "address"
  | "area"
  | "occupation"
  | "status"
  | "life_group"
  | "life_group_role"
  | "teams"
  | "joined_on"
  | "baptized_on"
  | "spouse"
  | "married_on"
  | "notes";

/** Kolom template, sekaligus urutan kolom ekspor. */
export const IMPORT_COLUMNS: { field: ImportField; title: string; hint: string; width: number; aliases: string[] }[] = [
  { field: "full_name", title: "Nama lengkap", hint: "Wajib diisi.", width: 28, aliases: ["nama", "name", "nama jemaat", "full name"] },
  { field: "nickname", title: "Nama panggilan", hint: "", width: 16, aliases: ["panggilan", "nickname", "nama panggil"] },
  { field: "gender", title: "Jenis kelamin", hint: "L atau P.", width: 14, aliases: ["jk", "gender", "kelamin", "l/p", "sex"] },
  { field: "birth_place", title: "Tempat lahir", hint: "", width: 16, aliases: ["kota lahir"] },
  {
    field: "birth_date",
    title: "Tanggal lahir",
    hint: "Format tanggal Excel, atau tulis 12/03/1990 (hari/bulan/tahun).",
    width: 15,
    aliases: ["tgl lahir", "tanggal lahir", "ulang tahun", "birthday", "lahir", "dob", "tgl. lahir"],
  },
  {
    field: "phone",
    title: "WhatsApp",
    hint: "Mis. 0812 3456 7890.",
    width: 18,
    aliases: ["wa", "no wa", "nomor wa", "no hp", "hp", "nomor hp", "telepon", "telp", "phone", "no telp", "handphone", "whatsapp"],
  },
  { field: "email", title: "Email", hint: "", width: 24, aliases: ["e-mail", "surel"] },
  { field: "address", title: "Alamat", hint: "", width: 36, aliases: ["alamat rumah", "address", "alamat lengkap"] },
  { field: "area", title: "Wilayah", hint: "Mis. Kelapa Gading.", width: 16, aliases: ["domisili", "kota", "daerah", "area", "kecamatan"] },
  { field: "occupation", title: "Pekerjaan atau sekolah", hint: "", width: 22, aliases: ["pekerjaan", "sekolah", "profesi", "kerja"] },
  {
    field: "status",
    title: "Status",
    hint: `Salah satu: ${Object.values(PERSON_STATUS_LABEL).join(", ")}. Kosong berarti Jemaat aktif.`,
    width: 15,
    aliases: ["status jemaat", "keanggotaan"],
  },
  { field: "life_group", title: "Life Group", hint: "Nama grup persis seperti di admin.", width: 22, aliases: ["lg", "lifegroup", "kelompok", "komsel", "life group"] },
  { field: "life_group_role", title: "Peran di Life Group", hint: "Anggota atau Leader.", width: 14, aliases: ["peran lg", "peran", "role"] },
  {
    field: "teams",
    title: "Pelayanan",
    hint: "Nama tim, pisahkan dengan titik koma. Peran boleh ditulis setelah titik dua: Musisi: Keyboard; Usher",
    width: 28,
    aliases: ["tim pelayanan", "pelayan", "pelayanan", "ministry"],
  },
  { field: "joined_on", title: "Mulai beribadah", hint: "Tanggal mulai beribadah di ENKG.", width: 15, aliases: ["tanggal bergabung", "bergabung", "join", "mulai ibadah"] },
  { field: "baptized_on", title: "Tanggal baptis", hint: "", width: 15, aliases: ["baptis", "tgl baptis", "baptism"] },
  {
    field: "spouse",
    title: "Nama pasangan",
    hint: "Nama lengkap suami/istri. Dihubungkan otomatis kalau namanya ada di file ini atau di database.",
    width: 26,
    aliases: ["pasangan", "suami", "istri", "suami/istri", "nama suami/istri", "spouse"],
  },
  { field: "married_on", title: "Tanggal menikah", hint: "Untuk pengingat anniversary.", width: 15, aliases: ["tgl menikah", "menikah", "anniversary", "tanggal nikah", "tgl nikah"] },
  { field: "notes", title: "Catatan", hint: "Hanya terlihat pengurus.", width: 30, aliases: ["keterangan", "catatan pengurus", "note", "notes"] },
  { field: "id", title: "ID", hint: "Biarkan apa adanya. Dipakai untuk memperbarui data hasil ekspor.", width: 38, aliases: ["id jemaat"] },
];

const fold = (value: string) =>
  value
    .toLocaleLowerCase("id")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9/]+/g, " ")
    .trim();

const HEADER_INDEX = new Map<string, ImportField>();
for (const column of IMPORT_COLUMNS) {
  for (const name of [column.title, ...column.aliases]) HEADER_INDEX.set(fold(name), column.field);
}

export function headerField(title: unknown): ImportField | null {
  return typeof title === "string" ? (HEADER_INDEX.get(fold(title)) ?? null) : null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Pembacaan sel
   ═══════════════════════════════════════════════════════════════════════════ */

export type Cell = string | number | boolean | Date | null | undefined;

const MONTHS: Record<string, number> = {
  jan: 1, januari: 1, january: 1,
  feb: 2, februari: 2, february: 2, pebruari: 2,
  mar: 3, maret: 3, march: 3,
  apr: 4, april: 4,
  mei: 5, may: 5,
  jun: 6, juni: 6, june: 6,
  jul: 7, juli: 7, july: 7,
  agu: 8, agt: 8, agustus: 8, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  okt: 10, oktober: 10, oct: 10, october: 10,
  nov: 11, nopember: 11, november: 11,
  des: 12, desember: 12, dec: 12, december: 12,
};

const pad = (n: number) => String(n).padStart(2, "0");

function ymd(y: number, m: number, d: number) {
  const value = `${y}-${pad(m)}-${pad(d)}`;
  return isValidDate(value) ? value : null;
}

/** Tahun dua digit: "90" → 1990, "05" → 2005 (patokan tahun sekarang). */
function fullYear(y: number, today: string) {
  if (y >= 100) return y;
  const century = Number(today.slice(0, 2)) * 100;
  return century + y > Number(today.slice(0, 4)) ? century - 100 + y : century + y;
}

/**
 * Tanggal dari sel Excel/CSV → "yyyy-mm-dd". Menerima sel tanggal Excel,
 * nomor seri Excel, "12/03/1990" (hari/bulan/tahun, cara Indonesia),
 * "1990-03-12", dan "12 Maret 1990".
 */
export function parseDateCell(cell: Cell, today: string): { value: string | null; error?: string } {
  if (cell === null || cell === undefined || cell === "") return { value: null };

  if (cell instanceof Date) {
    if (Number.isNaN(cell.getTime())) return { value: null, error: "Tanggal tidak terbaca" };
    // read-excel-file memberi tanggal sebagai tengah malam UTC.
    return { value: ymd(cell.getUTCFullYear(), cell.getUTCMonth() + 1, cell.getUTCDate()) };
  }

  if (typeof cell === "number") {
    // Nomor seri Excel: hari sejak 30 Desember 1899.
    if (cell < 1 || cell > 80000) return { value: null, error: "Tanggal tidak terbaca" };
    const date = new Date(Date.UTC(1899, 11, 30) + Math.round(cell) * 86_400_000);
    return { value: ymd(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()) };
  }

  const text = String(cell).trim().toLowerCase();
  let match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) {
    const value = ymd(Number(match[1]), Number(match[2]), Number(match[3]));
    return value ? { value } : { value: null, error: `Tanggal "${cell}" tidak ada` };
  }
  match = text.match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{2}|\d{4})$/);
  if (match) {
    const value = ymd(fullYear(Number(match[3]), today), Number(match[2]), Number(match[1]));
    return value ? { value } : { value: null, error: `Tanggal "${cell}" tidak ada. Tulis hari/bulan/tahun` };
  }
  match = text.match(/^(\d{1,2})[\s-]+([a-z]+)\.?[\s-]+(\d{2}|\d{4})$/);
  if (match && MONTHS[match[2]!]) {
    const value = ymd(fullYear(Number(match[3]), today), MONTHS[match[2]!]!, Number(match[1]));
    return value ? { value } : { value: null, error: `Tanggal "${cell}" tidak ada` };
  }
  return { value: null, error: `Tanggal "${cell}" tidak terbaca. Tulis 12/03/1990` };
}

export function parseGender(cell: Cell): { value: Gender | null; error?: string } {
  const text = fold(String(cell ?? ""));
  if (!text) return { value: null };
  if (["l", "lk", "laki", "laki laki", "pria", "cowok", "male", "m"].includes(text)) return { value: "L" };
  if (["p", "pr", "perempuan", "wanita", "cewek", "female", "f", "w"].includes(text)) return { value: "P" };
  return { value: null, error: `Jenis kelamin "${cell}" tidak dikenal. Tulis L atau P` };
}

const STATUS_WORDS: Record<string, PersonStatus> = {
  aktif: "aktif",
  "jemaat aktif": "aktif",
  jemaat: "aktif",
  baru: "baru",
  "jemaat baru": "baru",
  simpatisan: "simpatisan",
  tamu: "simpatisan",
  "tidak aktif": "tidak_aktif",
  nonaktif: "tidak_aktif",
  "non aktif": "tidak_aktif",
  tidak_aktif: "tidak_aktif",
  pindah: "pindah",
  "pindah gereja": "pindah",
};

export function parseStatus(cell: Cell): { value: PersonStatus; error?: string } {
  const text = fold(String(cell ?? "")).replace(/_/g, " ");
  if (!text) return { value: "aktif" };
  const value = STATUS_WORDS[text] ?? STATUS_WORDS[text.replace(/ /g, "_")];
  return value ? { value } : { value: "aktif", error: `Status "${cell}" tidak dikenal, dianggap Jemaat aktif` };
}

export function parseRole(cell: Cell): LifeGroupRole {
  return /leader|pemimpin|ketua/.test(fold(String(cell ?? ""))) ? "leader" : "anggota";
}

/** "Musisi: Keyboard; Usher, Doa" atau "Musisi (Keyboard)" → daftar tim + peran. */
export function parseTeams(cell: Cell): { team: string; role: string | null }[] {
  const text = String(cell ?? "").trim();
  if (!text) return [];
  return text
    .split(/[;,\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const paren = part.match(/^(.+?)\s*\((.+)\)\s*$/);
      if (paren) return { team: paren[1]!.trim(), role: paren[2]!.trim() || null };
      const [team, ...rest] = part.split(":");
      return { team: team!.trim(), role: rest.join(":").trim() || null };
    })
    .filter((item) => item.team);
}

const cellText = (cell: Cell, max: number) => {
  if (cell === null || cell === undefined) return "";
  if (cell instanceof Date) return "";
  return String(cell).replace(/\s+/g, " ").trim().slice(0, max);
};

/* ═══════════════════════════════════════════════════════════════════════════
   Baris → data jemaat
   ═══════════════════════════════════════════════════════════════════════════ */

export type ImportValues = {
  id: string | null;
  full_name: string;
  nickname: string | null;
  gender: Gender | null;
  birth_place: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  area: string | null;
  occupation: string | null;
  status: PersonStatus;
  /** true kalau kolom Status diisi; kosong tidak menimpa status data lama. */
  status_given: boolean;
  life_group: string | null;
  life_group_role: LifeGroupRole;
  teams: { team: string; role: string | null }[];
  joined_on: string | null;
  baptized_on: string | null;
  spouse: string | null;
  married_on: string | null;
  notes: string | null;
};

export type Issue = { level: "error" | "warning"; message: string };

export type RawRow = Partial<Record<ImportField, Cell>>;

export type ImportRow = { line: number; values: ImportValues; issues: Issue[]; raw: RawRow };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Satu baris tabel (sudah dipetakan ke field) → nilai yang rapi + daftar masalah. */
export function parseRow(raw: RawRow, line: number, today: string): ImportRow {
  const issues: Issue[] = [];
  const text = (field: ImportField, max: number) => cellText(raw[field], max) || null;
  const date = (field: ImportField, label: string) => {
    const parsed = parseDateCell(raw[field], today);
    if (parsed.error) issues.push({ level: "warning", message: `${label}: ${parsed.error}, dikosongkan` });
    return parsed.value;
  };

  const fullName = cellText(raw.full_name, 160);
  if (fullName.length < 2) issues.push({ level: "error", message: "Nama lengkap kosong" });

  const gender = parseGender(raw.gender);
  if (gender.error) issues.push({ level: "warning", message: gender.error });

  const status = parseStatus(raw.status);
  if (status.error) issues.push({ level: "warning", message: status.error });

  let birthDate = date("birth_date", "Tanggal lahir");
  if (birthDate && birthDate > today) {
    issues.push({ level: "warning", message: "Tanggal lahir setelah hari ini, dikosongkan" });
    birthDate = null;
  }

  let phone = text("phone", 40);
  if (typeof raw.phone === "number") phone = `0${String(raw.phone).replace(/^62/, "")}`; // Excel membuang angka 0 di depan
  if (phone && !/^\d{8,15}$/.test(phoneDigits(phone))) {
    issues.push({ level: "warning", message: `Nomor WA "${phone}" sepertinya belum lengkap, dikosongkan` });
    phone = null;
  }

  let email = text("email", 200)?.toLowerCase() ?? null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    issues.push({ level: "warning", message: `Email "${email}" belum benar, dikosongkan` });
    email = null;
  }

  const id = text("id", 40);
  const marriedOn = date("married_on", "Tanggal menikah");
  const spouse = text("spouse", 160);
  if (marriedOn && !spouse) issues.push({ level: "warning", message: "Tanggal menikah diisi tanpa nama pasangan, dilewati" });

  return {
    line,
    issues,
    raw,
    values: {
      id: id && UUID.test(id) ? id.toLowerCase() : null,
      full_name: fullName,
      nickname: text("nickname", 60),
      gender: gender.value,
      birth_place: text("birth_place", 80),
      birth_date: birthDate,
      phone,
      email,
      address: cellText(raw.address, 400) || null,
      area: text("area", 80),
      occupation: text("occupation", 120),
      status: status.value,
      status_given: Boolean(cellText(raw.status, 40)),
      life_group: text("life_group", 80),
      life_group_role: parseRole(raw.life_group_role),
      teams: parseTeams(raw.teams).slice(0, 10),
      joined_on: date("joined_on", "Mulai beribadah"),
      baptized_on: date("baptized_on", "Tanggal baptis"),
      spouse,
      married_on: spouse ? marriedOn : null,
      notes: raw.notes === null || raw.notes === undefined ? null : String(raw.notes).trim().slice(0, 4000) || null,
    },
  };
}

/**
 * Lembar kerja (baris-baris sel) → baris impor. Baris judul dicari di 10
 * baris pertama: baris pertama yang punya kolom nama.
 */
export function parseSheet(sheet: Cell[][], today: string) {
  const headerIndex = sheet.slice(0, 10).findIndex((row) => row.some((cell) => headerField(cell) === "full_name"));
  if (headerIndex === -1) {
    return { error: "Kolom \"Nama lengkap\" tidak ditemukan. Pakai template, atau beri judul kolom Nama." } as const;
  }

  const header = sheet[headerIndex]!;
  const fields = header.map((cell) => headerField(cell));
  const unknown = header.filter((cell, index) => cell !== null && String(cell).trim() && !fields[index]).map(String);

  const rows: ImportRow[] = [];
  for (let i = headerIndex + 1; i < sheet.length; i++) {
    const cells = sheet[i]!;
    if (!cells.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== "")) continue;
    const raw: RawRow = {};
    fields.forEach((field, index) => {
      if (field && raw[field] === undefined) raw[field] = cells[index];
    });
    rows.push(parseRow(raw, i + 1, today));
    if (rows.length > MAX_IMPORT_ROWS) {
      return { error: `Maksimal ${MAX_IMPORT_ROWS} baris sekali impor. Pecah filenya jadi beberapa bagian.` } as const;
    }
  }

  return { rows, mapped: [...new Set(fields.filter((f): f is ImportField => Boolean(f)))], unknown } as const;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Pencocokan dengan database
   ═══════════════════════════════════════════════════════════════════════════ */

export type Existing = { id: string; full_name: string; phone: string | null; birth_date: string | null };

export const nameKey = (name: string) => fold(name).replace(/\s+/g, " ");

/**
 * Data lama yang sama: ID hasil ekspor, lalu nomor WA, lalu nama + tanggal
 * lahir, lalu nama saja bila di database hanya ada satu orang dengan nama itu.
 */
export function findExisting(values: ImportValues, existing: Existing[]) {
  if (values.id) {
    const byId = existing.find((person) => person.id === values.id);
    if (byId) return byId;
  }
  if (values.phone) {
    const digits = phoneDigits(values.phone);
    const byPhone = existing.find((person) => person.phone && phoneDigits(person.phone) === digits);
    if (byPhone) return byPhone;
  }
  const key = nameKey(values.full_name);
  const sameName = existing.filter((person) => nameKey(person.full_name) === key);
  if (values.birth_date) {
    const exact = sameName.find((person) => person.birth_date === values.birth_date);
    if (exact) return exact;
    // Nama sama tapi tanggal lahir lain: anggap orang berbeda.
    return sameName.length === 1 && !sameName[0]!.birth_date ? sameName[0]! : null;
  }
  return sameName.length === 1 ? sameName[0]! : null;
}

/** Tandai baris yang dobel di dalam file yang sama (nomor WA atau nama + tanggal lahir). */
export function markDuplicatesInFile(rows: ImportRow[]) {
  const seen = new Map<string, number>();
  for (const row of rows) {
    const keys = [
      row.values.phone ? `wa:${phoneDigits(row.values.phone)}` : null,
      row.values.full_name ? `nama:${nameKey(row.values.full_name)}|${row.values.birth_date ?? ""}` : null,
    ].filter((key): key is string => Boolean(key));
    const first = keys.map((key) => seen.get(key)).find((line) => line !== undefined);
    if (first !== undefined) {
      row.issues.push({ level: "error", message: `Dobel dengan baris ${first}` });
    } else {
      for (const key of keys) seen.set(key, row.line);
    }
  }
  return rows;
}

/** Cocokkan nama grup/tim tanpa peduli huruf besar dan spasi. */
export function matchByName<T extends { name: string }>(name: string | null, items: T[]) {
  if (!name) return null;
  const key = nameKey(name);
  return items.find((item) => nameKey(item.name) === key) ?? null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CSV & kiriman ke server
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * CSV → baris sel. Excel versi Indonesia menyimpan CSV dengan titik koma,
 * Google Sheets dengan koma; pemisahnya ditebak dari baris pertama.
 */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, "");
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i]!;
    if (quoted) {
      if (char === '"' && clean[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && clean[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Sel yang aman dikirim lewat JSON: tanggal Excel jadi "yyyy-mm-dd". */
export function serializeRaw(raw: RawRow): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  for (const [field, cell] of Object.entries(raw)) {
    if (cell instanceof Date) {
      out[field] = Number.isNaN(cell.getTime())
        ? null
        : `${cell.getUTCFullYear()}-${pad(cell.getUTCMonth() + 1)}-${pad(cell.getUTCDate())}`;
    } else {
      out[field] = cell === undefined ? null : cell;
    }
  }
  return out;
}

/** Kiriman dari browser → RawRow, hanya field yang dikenal dan tipe sederhana. */
export function sanitizeRaw(input: unknown): RawRow {
  const raw: RawRow = {};
  if (!input || typeof input !== "object") return raw;
  const known = new Set(IMPORT_COLUMNS.map((column) => column.field));
  for (const [field, cell] of Object.entries(input as Record<string, unknown>)) {
    if (!known.has(field as ImportField)) continue;
    if (typeof cell === "string") raw[field as ImportField] = cell.slice(0, 4000);
    else if (typeof cell === "number" && Number.isFinite(cell)) raw[field as ImportField] = cell;
    else if (typeof cell === "boolean") raw[field as ImportField] = cell;
  }
  return raw;
}
