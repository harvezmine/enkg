"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { importPeopleBatch, linkImportedSpouses, type RowOutcome } from "@/app/actions/people-import";
import { Icon } from "@/components/icons";
import { PERSON_STATUS_LABEL } from "@/lib/db-types";
import { formatCalendarDate, todayWib } from "@/lib/people";
import {
  findExisting,
  markDuplicatesInFile,
  matchByName,
  nameKey,
  parseCsv,
  parseSheet,
  serializeRaw,
  type Cell,
  type Existing,
  type ImportRow,
} from "@/lib/people-import";
import { cn } from "@/lib/utils";

import { Badge, Card, Notice } from "../ui";

const BATCH = 200;
const PREVIEW_LIMIT = 150;

type Named = { name: string };
type Annotated = ImportRow & { match: Existing | null };
type Phase = "pilih" | "pratinjau" | "menyimpan" | "selesai";

async function readFile(file: File): Promise<Cell[][]> {
  if (/\.csv$/i.test(file.name) || file.type === "text/csv") return parseCsv(await file.text());
  const { readSheet } = await import("read-excel-file/browser");
  return (await readSheet(file)) as Cell[][];
}

/**
 * Impor jemaat dari Excel dalam tiga langkah: pilih file, periksa
 * pratinjau, simpan. Simpan dikirim per kelompok kecil supaya kemajuannya
 * terlihat dan tidak menabrak batas ukuran kiriman.
 */
export function ImportWizard({
  existing,
  lifeGroups,
  teams,
}: {
  existing: Existing[];
  lifeGroups: Named[];
  teams: Named[];
}) {
  const [phase, setPhase] = useState<Phase>("pilih");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Annotated[]>([]);
  const [unknownColumns, setUnknownColumns] = useState<string[]>([]);
  const [onDuplicate, setOnDuplicate] = useState<"skip" | "update">("skip");
  const [filter, setFilter] = useState<"semua" | "masalah" | "ada">("semua");
  const [showAll, setShowAll] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outcomes, setOutcomes] = useState<RowOutcome[]>([]);
  const [spouseNote, setSpouseNote] = useState<{ linked: number; problems: { line: number; message: string }[] } | null>(null);
  const [dragging, setDragging] = useState(false);

  const load = async (file: File) => {
    setError(null);
    if (file.size > 8 * 1024 * 1024) return setError("File terlalu besar (maksimal 8 MB).");
    try {
      const today = todayWib();
      const result = parseSheet(await readFile(file), today);
      if ("error" in result) return setError(result.error ?? "File tidak terbaca.");

      const fileNames = new Set(result.rows.map((row) => nameKey(row.values.full_name)));
      const dbNames = new Set(existing.map((person) => nameKey(person.full_name)));
      const annotated = markDuplicatesInFile(result.rows).map((row) => {
        const issues = [...row.issues];
        const { life_group, teams: rowTeams, spouse } = row.values;
        if (life_group && !matchByName(life_group, lifeGroups)) {
          issues.push({ level: "warning", message: `Life Group "${life_group}" belum ada di admin, kolom ini dilewati` });
        }
        const unknownTeams = rowTeams.filter((t) => !matchByName(t.team, teams)).map((t) => t.team);
        if (unknownTeams.length) issues.push({ level: "warning", message: `Tim belum ada: ${unknownTeams.join(", ")}, dilewati` });
        if (spouse && !fileNames.has(nameKey(spouse)) && !dbNames.has(nameKey(spouse))) {
          issues.push({ level: "warning", message: `Pasangan "${spouse}" tidak ada di file maupun database` });
        }
        return { ...row, issues, match: row.values.full_name ? findExisting(row.values, existing) : null };
      });

      setFileName(file.name);
      setRows(annotated);
      setUnknownColumns(result.unknown);
      setFilter("semua");
      setShowAll(false);
      setPhase("pratinjau");
    } catch (err) {
      console.error("[impor]", err);
      setError("File tidak terbaca. Pastikan formatnya .xlsx atau .csv.");
    }
  };

  const counts = useMemo(() => {
    const errors = rows.filter((row) => row.issues.some((issue) => issue.level === "error"));
    const valid = rows.filter((row) => !errors.includes(row));
    return {
      errors: errors.length,
      warnings: valid.filter((row) => row.issues.length).length,
      fresh: valid.filter((row) => !row.match).length,
      existing: valid.filter((row) => row.match).length,
    };
  }, [rows]);

  const shown = rows.filter((row) =>
    filter === "masalah" ? row.issues.length > 0 : filter === "ada" ? row.match : true,
  );

  const save = async () => {
    const valid = rows.filter((row) => !row.issues.some((issue) => issue.level === "error"));
    setPhase("menyimpan");
    setProgress(0);
    const collected: RowOutcome[] = [];
    for (let i = 0; i < valid.length; i += BATCH) {
      const chunk = valid.slice(i, i + BATCH).map((row) => ({ line: row.line, raw: serializeRaw(row.raw) }));
      const result = await importPeopleBatch(JSON.stringify({ rows: chunk, onDuplicate }));
      if (!result.ok) {
        setError(result.message ?? "Impor berhenti di tengah jalan.");
        break;
      }
      collected.push(...result.results);
      setProgress(Math.min(valid.length, i + BATCH) / valid.length);
    }

    const pairs = collected
      .filter((o) => o.personId && o.spouse && o.outcome !== "failed")
      .map((o) => ({ line: o.line, personId: o.personId, spouse: o.spouse, marriedOn: o.marriedOn }));
    setSpouseNote(pairs.length ? await linkImportedSpouses(JSON.stringify(pairs)) : null);
    setOutcomes(collected);
    setPhase("selesai");
  };

  /* ── Langkah 1: pilih file ─────────────────────────────────────────────── */
  if (phase === "pilih") {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = event.dataTransfer.files[0];
            if (file) load(file);
          }}
          className={cn(
            "grid min-h-72 cursor-pointer place-items-center rounded-3xl border-2 border-dashed p-8 text-center transition",
            dragging ? "border-navy-700 bg-navy-50" : "border-ink/15 bg-white hover:border-navy-700",
          )}
        >
          <input
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) load(file);
              event.target.value = "";
            }}
          />
          <span>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sun-400/25 text-navy-800">
              <Icon.news className="h-6 w-6" />
            </span>
            <span className="font-display mt-4 block text-xl font-bold text-ink">Pilih file Excel</span>
            <span className="mt-1.5 block text-sm text-ink-soft">atau tarik ke sini. Format .xlsx atau .csv.</span>
            {error && (
              <span className="mt-4 block">
                <Notice tone="error">{error}</Notice>
              </span>
            )}
          </span>
        </label>

        <Card className="space-y-4 p-5">
          <div>
            <p className="font-display text-lg font-bold text-ink">Belum punya file?</p>
            <p className="mt-1 text-sm text-ink-soft">Spreadsheet lama juga bisa, asal ada kolom nama.</p>
          </div>
          <a href="/admin/jemaat-excel/template" className="btn btn-navy w-full px-4 py-2.5 text-sm">
            Unduh template
          </a>
        </Card>
      </div>
    );
  }

  /* ── Langkah 3: selesai ────────────────────────────────────────────────── */
  if (phase === "selesai") {
    const by = (outcome: RowOutcome["outcome"]) => outcomes.filter((o) => o.outcome === outcome);
    const failed = by("failed");
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Ditambahkan", value: by("added").length, tone: "text-emerald-700" },
            { label: "Diperbarui", value: by("updated").length, tone: "text-navy-700" },
            { label: "Dilewati", value: by("skipped").length, tone: "text-ink-soft" },
            { label: "Gagal", value: failed.length + counts.errors, tone: "text-red-700" },
          ].map((tile) => (
            <Card key={tile.label} className="p-5">
              <p className={cn("font-display tabular text-3xl font-bold", tile.tone)}>{tile.value}</p>
              <p className="mt-1 text-xs font-medium text-ink-soft">{tile.label}</p>
            </Card>
          ))}
        </div>
        {spouseNote && (
          <Notice tone={spouseNote.problems.length ? "error" : "success"}>
            {spouseNote.linked} pasangan terhubung.
            {spouseNote.problems.length > 0 &&
              ` Belum terhubung: ${spouseNote.problems.map((p) => `baris ${p.line} (${p.message})`).join("; ")}.`}
          </Notice>
        )}
        {error && <Notice tone="error">{error}</Notice>}
        {failed.length > 0 && (
          <Card className="p-5">
            <p className="font-semibold text-ink">Baris yang gagal</p>
            <ul className="mt-2 space-y-1 text-sm text-ink-soft">
              {failed.map((o) => (
                <li key={o.line}>
                  Baris {o.line}: {o.message}
                </li>
              ))}
            </ul>
          </Card>
        )}
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/jemaat" className="btn btn-navy px-5 py-2.5 text-sm">
            Lihat data jemaat
          </Link>
          <button
            type="button"
            onClick={() => {
              setRows([]);
              setOutcomes([]);
              setError(null);
              setPhase("pilih");
            }}
            className="btn btn-outline px-5 py-2.5 text-sm"
          >
            Impor file lain
          </button>
        </div>
      </div>
    );
  }

  /* ── Langkah 2: pratinjau & simpan ─────────────────────────────────────── */
  const importable = counts.fresh + (onDuplicate === "update" ? counts.existing : 0);
  const saving = phase === "menyimpan";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-ink">
          <Icon.news className="h-4 w-4 text-ink-soft" />
          <span className="font-semibold">{fileName}</span>
          <span className="text-ink-soft">· {rows.length} baris</span>
        </p>
        {!saving && (
          <button type="button" onClick={() => setPhase("pilih")} className="text-sm font-semibold text-navy-700 hover:underline">
            Ganti file
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { key: "semua", label: "Orang baru", value: counts.fresh, tone: "text-emerald-700" },
          { key: "ada", label: "Sudah ada di database", value: counts.existing, tone: "text-navy-700" },
          { key: "masalah", label: "Ada catatan", value: counts.warnings, tone: "text-[#7a5a00]" },
          { key: "masalah", label: "Tidak bisa diimpor", value: counts.errors, tone: "text-red-700" },
        ].map((tile) => (
          <button
            key={tile.label}
            type="button"
            onClick={() => setFilter(tile.key as typeof filter)}
            className={cn(
              "rounded-2xl bg-white p-5 text-left shadow-soft ring-1 transition hover:-translate-y-0.5",
              filter === tile.key && tile.key !== "semua" ? "ring-navy-700" : "ring-ink/8",
            )}
          >
            <p className={cn("font-display tabular text-3xl font-bold", tile.tone)}>{tile.value}</p>
            <p className="mt-1 text-xs font-medium text-ink-soft">{tile.label}</p>
          </button>
        ))}
      </div>

      {unknownColumns.length > 0 && (
        <p className="rounded-xl bg-cream-50 p-3 text-sm text-ink-soft">
          Kolom yang tidak dikenal dan dilewati: {unknownColumns.join(", ")}.
        </p>
      )}

      {counts.existing > 0 && (
        <Card className="p-4 sm:p-5">
          <p className="text-sm font-semibold text-ink">{counts.existing} orang sudah ada di database. Mau diapakan?</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              { value: "skip", title: "Lewati", text: "Data lama dibiarkan apa adanya." },
              { value: "update", title: "Perbarui", text: "Kolom yang terisi di file menimpa data lama. Kolom kosong tidak menghapus apa pun." },
            ].map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-xl p-3.5 ring-1 transition",
                  onDuplicate === option.value ? "bg-navy-50 ring-navy-700" : "bg-white ring-ink/10 hover:ring-ink/25",
                )}
              >
                <input
                  type="radio"
                  name="on-duplicate"
                  value={option.value}
                  checked={onDuplicate === option.value}
                  onChange={() => setOnDuplicate(option.value as "skip" | "update")}
                  className="mt-0.5 h-4 w-4 accent-navy-700"
                  disabled={saving}
                />
                <span>
                  <span className="block text-sm font-semibold text-ink">{option.title}</span>
                  <span className="block text-xs leading-relaxed text-ink-soft">{option.text}</span>
                </span>
              </label>
            ))}
          </div>
        </Card>
      )}

      <nav className="flex gap-1 overflow-x-auto rounded-full bg-white p-1 ring-1 ring-ink/8 sm:w-fit" aria-label="Saring baris">
        {[
          { key: "semua", label: `Semua (${rows.length})` },
          { key: "ada", label: `Sudah ada (${counts.existing})` },
          { key: "masalah", label: `Perlu dicek (${counts.warnings + counts.errors})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key as typeof filter)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition",
              filter === tab.key ? "bg-navy-700 text-cream-100" : "text-ink-soft hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {(showAll ? shown : shown.slice(0, PREVIEW_LIMIT)).map((row) => {
          const blocked = row.issues.some((issue) => issue.level === "error");
          const v = row.values;
          return (
            <li
              key={row.line}
              className={cn(
                "rounded-2xl bg-white p-4 ring-1",
                blocked ? "ring-red-200" : row.issues.length ? "ring-sun-500/40" : "ring-ink/8",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{v.full_name || <span className="text-red-700">Tanpa nama</span>}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-soft">
                    {[v.phone, v.birth_date ? formatCalendarDate(v.birth_date) : null, v.area, v.life_group]
                      .filter(Boolean)
                      .join(" · ") || "Data lain kosong"}
                  </p>
                </div>
                <span className="tabular shrink-0 rounded-full bg-cream-100 px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
                  Baris {row.line}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {blocked ? (
                  <Badge tone="red">Tidak diimpor</Badge>
                ) : row.match ? (
                  <Badge tone="navy">
                    {onDuplicate === "update" ? "Diperbarui" : "Dilewati"}: sudah ada {row.match.full_name}
                  </Badge>
                ) : (
                  <Badge tone="green">Orang baru</Badge>
                )}
                {v.status !== "aktif" && <Badge tone="gray">{PERSON_STATUS_LABEL[v.status]}</Badge>}
                {v.spouse && <Badge tone="gray">Pasangan: {v.spouse}</Badge>}
                {v.teams.length > 0 && <Badge tone="gray">{v.teams.map((t) => t.team).join(", ")}</Badge>}
              </div>
              {row.issues.length > 0 && (
                <ul className="mt-2.5 space-y-1 text-xs">
                  {row.issues.map((issue) => (
                    <li key={issue.message} className={issue.level === "error" ? "text-red-700" : "text-[#7a5a00]"}>
                      {issue.message}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      {!showAll && shown.length > PREVIEW_LIMIT && (
        <button type="button" onClick={() => setShowAll(true)} className="text-sm font-semibold text-navy-700 hover:underline">
          Tampilkan {shown.length - PREVIEW_LIMIT} baris lagi
        </button>
      )}

      <div className="sticky bottom-24 z-10 -mx-2 rounded-[1.75rem] bg-cream-100 p-2 shadow-[0_-20px_24px_-4px_var(--color-cream-100)] lg:bottom-4">
        {saving ? (
          <div className="rounded-full bg-white p-1.5 ring-1 ring-ink/10">
            <div className="h-9 rounded-full bg-navy-700 transition-all" style={{ width: `${Math.max(8, progress * 100)}%` }} />
            <p className="sr-only" aria-live="polite">
              Menyimpan {Math.round(progress * 100)} persen
            </p>
          </div>
        ) : (
          <button type="button" onClick={save} disabled={!importable} className="btn btn-navy w-full">
            {importable ? `Simpan ${importable} orang` : "Tidak ada yang perlu disimpan"}
          </button>
        )}
      </div>
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}
