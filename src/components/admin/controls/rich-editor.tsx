"use client";

import { useRef, useState } from "react";

import { RichText } from "@/components/rich-text";
import { cn } from "@/lib/utils";

/*
 * Kotak tulisan untuk News, event, dan materi. Formatnya tetap teks biasa
 * (## sub-judul, **tebal**, - daftar), tapi pengurus cukup menekan tombol;
 * tidak perlu hafal simbolnya. Tab Pratinjau menampilkan hasil akhirnya.
 */

type Action = { label: string; title: string; apply: (selected: string) => { text: string; line?: boolean } };

const ACTIONS: Action[] = [
  { label: "Sub-judul", title: "Jadikan sub-judul", apply: (s) => ({ text: `## ${s || "Sub-judul"}`, line: true }) },
  { label: "Tebal", title: "Tebalkan tulisan", apply: (s) => ({ text: `**${s || "tulisan tebal"}**` }) },
  { label: "Miring", title: "Miringkan tulisan", apply: (s) => ({ text: `*${s || "tulisan miring"}*` }) },
  {
    label: "Daftar",
    title: "Daftar berpoin",
    apply: (s) => ({ text: (s || "Poin pertama\nPoin kedua").split("\n").map((l) => `- ${l.replace(/^[-*]\s+/, "")}`).join("\n"), line: true }),
  },
  {
    label: "Nomor",
    title: "Daftar bernomor",
    apply: (s) => ({ text: (s || "Langkah pertama\nLangkah kedua").split("\n").map((l, i) => `${i + 1}. ${l.replace(/^\d+[.)]\s+/, "")}`).join("\n"), line: true }),
  },
  { label: "Kutipan", title: "Kutipan atau ayat", apply: (s) => ({ text: `> ${s || "Kutipan atau ayat"}`, line: true }) },
];

export function RichEditor({
  id,
  name,
  value,
  defaultValue,
  onChange,
  placeholder,
  required,
  minHeight = "min-h-80",
}: {
  id?: string;
  name: string;
  value?: string;
  defaultValue?: string | null;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minHeight?: string;
}) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const text = value !== undefined ? value : internal;
  const [tab, setTab] = useState<"tulis" | "pratinjau">("tulis");
  const area = useRef<HTMLTextAreaElement>(null);

  const set = (next: string) => {
    if (value === undefined) setInternal(next);
    onChange?.(next);
    requestAnimationFrame(() => area.current?.dispatchEvent(new Event("input", { bubbles: true })));
  };

  const run = (action: Action) => {
    const el = area.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = text.slice(start, end);
    const result = action.apply(selected);
    // Format baris (sub-judul, daftar, kutipan) selalu mulai di baris baru.
    const before = text.slice(0, start);
    const prefix = result.line && before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
    const suffix = result.line ? "\n\n" : "";
    const inserted = `${prefix}${result.text}${suffix}`;
    set(before + inserted + text.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + inserted.length - suffix.length;
      el.setSelectionRange(caret, caret);
    });
  };

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="overflow-hidden rounded-xl border border-ink/12 bg-white focus-within:border-navy-700 focus-within:ring-4 focus-within:ring-navy-700/10">
      <div className="flex flex-wrap items-center gap-1 border-b border-ink/8 bg-cream-50 p-1.5">
        <div className="mr-auto flex rounded-full bg-white p-0.5 ring-1 ring-ink/8" role="tablist">
          {(["tulis", "pratinjau"] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition",
                tab === key ? "bg-navy-700 text-cream-100" : "text-ink-soft hover:text-ink",
              )}
            >
              {key === "tulis" ? "Tulis" : "Pratinjau"}
            </button>
          ))}
        </div>
        {tab === "tulis" &&
          ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              title={action.title}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => run(action)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink-soft transition hover:bg-white hover:text-navy-700",
                action.label === "Tebal" && "font-extrabold",
                action.label === "Miring" && "italic",
              )}
            >
              {action.label}
            </button>
          ))}
      </div>

      <textarea
        ref={area}
        id={id}
        name={name}
        value={text}
        onChange={(event) => set(event.target.value)}
        placeholder={placeholder}
        required={required}
        hidden={tab !== "tulis"}
        className={cn("block w-full resize-y bg-white px-4 py-3.5 text-[15px] leading-relaxed text-ink outline-none placeholder:text-ink-soft/50", minHeight)}
      />
      {tab === "pratinjau" && (
        <div className={cn("bg-white px-5 py-4", minHeight)}>
          {text.trim() ? <RichText content={text} /> : <p className="text-sm text-ink-soft">Belum ada tulisan.</p>}
        </div>
      )}
      <p className="border-t border-ink/8 bg-cream-50 px-3.5 py-1.5 text-right text-xs text-ink-soft">{words} kata</p>
    </div>
  );
}
