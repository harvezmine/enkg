"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { Icon } from "@/components/icons";
import { formatCalendarDate, isValidDate, todayWib } from "@/lib/people";
import { parseDateCell } from "@/lib/people-import";
import { cn } from "@/lib/utils";

import { Popover, useDismiss } from "./popover";

/*
 * Pemilih tanggal & jam custom pengganti <input type="date|time|datetime-local">.
 * Nilai yang dikirim ke form tetap format standar ("yyyy-mm-dd", "HH:MM",
 * "yyyy-mm-ddTHH:MM"), jadi Server Action yang ada tidak perlu berubah.
 */

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

const trigger =
  "flex w-full items-center justify-between gap-3 rounded-xl border border-ink/12 bg-white px-4 py-3 text-left text-[15px] text-ink outline-none transition hover:border-ink/25 focus-visible:border-navy-700 focus-visible:ring-4 focus-visible:ring-navy-700/10 disabled:opacity-60";

/**
 * Input tersembunyi yang tetap ikut validasi "wajib isi" browser dan
 * pengiriman form, plus memberi tahu pendengar `input` (penanda belum disimpan).
 */
function FormValue({ name, value, required, form }: { name?: string; value: string; required?: boolean; form?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  // Bandingkan dengan nilai sebelumnya (bukan "render pertama"): StrictMode
  // menjalankan efek dua kali, dan form tidak boleh langsung dianggap berubah.
  const previous = useRef(value);
  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    ref.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [value]);
  return (
    <input
      ref={ref}
      name={name}
      form={form}
      value={value}
      onChange={() => {}}
      required={required}
      tabIndex={-1}
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 left-4 h-px w-px opacity-0"
    />
  );
}

/** Kembali ke nilai awal saat form di-reset. */
function useFormReset(ref: RefObject<HTMLElement | null>, reset: () => void) {
  const fn = useRef(reset);
  fn.current = reset;
  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const handler = () => fn.current();
    form.addEventListener("reset", handler);
    return () => form.removeEventListener("reset", handler);
  }, [ref]);
}

function useControlled(value: string | undefined, defaultValue: string | undefined, onChange?: (value: string) => void) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const current = value !== undefined ? value : internal;
  const set = (next: string) => {
    if (value === undefined) setInternal(next);
    onChange?.(next);
  };
  return [current, set, () => setInternal(defaultValue ?? "")] as const;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tanggal
   ═══════════════════════════════════════════════════════════════════════════ */

type View = "day" | "month" | "year";

function Calendar({
  value,
  min,
  max,
  startView,
  onPick,
}: {
  value: string;
  min?: string;
  max?: string;
  startView: View;
  onPick: (value: string) => void;
}) {
  const today = todayWib();
  const base = value || (max && max < today ? max : today);
  const [year, setYear] = useState(Number(base.slice(0, 4)));
  const [month, setMonth] = useState(Number(base.slice(5, 7)));
  const [view, setView] = useState<View>(value ? "day" : startView);
  const pageStart = Math.floor(year / 12) * 12;
  const out = (date: string) => Boolean((min && date < min) || (max && date > max));

  const shift = (delta: number) => {
    if (view === "day") {
      const total = year * 12 + (month - 1) + delta;
      setYear(Math.floor(total / 12));
      setMonth((total % 12) + 1);
    } else if (view === "month") setYear(year + delta);
    else setYear(year + delta * 12);
  };

  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = Array.from({ length: 42 }, (_, i) => i - first + 1);

  const title =
    view === "day" ? `${MONTHS[month - 1]} ${year}` : view === "month" ? String(year) : `${pageStart} - ${pageStart + 11}`;

  return (
    <div className="p-3 select-none">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button type="button" onClick={() => shift(-1)} aria-label="Sebelumnya" className="grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-cream-100">
          <Icon.arrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setView(view === "day" ? "year" : view === "year" ? "month" : "day")}
          className="font-display rounded-full px-4 py-2 text-base font-bold text-ink hover:bg-cream-100"
        >
          {title}
          <Icon.chevronDown className="ml-1 inline h-4 w-4 text-ink-soft" />
        </button>
        <button type="button" onClick={() => shift(1)} aria-label="Berikutnya" className="grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-cream-100">
          <Icon.arrowRight className="h-4 w-4" />
        </button>
      </div>

      {view === "day" && (
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {DAYS.map((day) => (
            <span key={day} className={cn("py-1.5 text-[11px] font-semibold", day === "Min" ? "text-navy-700" : "text-ink-soft")}>
              {day}
            </span>
          ))}
          {cells.map((day, index) => {
            if (day < 1 || day > days) return <span key={index} />;
            const date = ymd(year, month, day);
            const selected = date === value;
            const disabled = out(date);
            return (
              <button
                key={index}
                type="button"
                disabled={disabled}
                onClick={() => onPick(date)}
                aria-pressed={selected}
                aria-label={formatCalendarDate(date)}
                className={cn(
                  "tabular grid h-10 place-items-center rounded-xl text-sm font-medium transition",
                  selected ? "bg-navy-700 font-bold text-cream-100" : "text-ink hover:bg-navy-50",
                  !selected && date === today && "ring-2 ring-sun-500 ring-inset",
                  disabled && "pointer-events-none text-ink-soft/30",
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      )}

      {view === "month" && (
        <div className="grid grid-cols-3 gap-1.5">
          {MONTHS.map((name, index) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setMonth(index + 1);
                setView("day");
              }}
              className={cn(
                "rounded-xl py-3 text-sm font-semibold transition",
                index + 1 === month && year === Number(value.slice(0, 4)) ? "bg-navy-700 text-cream-100" : "text-ink hover:bg-navy-50",
              )}
            >
              {name.slice(0, 3)}
            </button>
          ))}
        </div>
      )}

      {view === "year" && (
        <div className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: 12 }, (_, i) => pageStart + i).map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => {
                setYear(y);
                setView("month");
              }}
              className={cn(
                "tabular rounded-xl py-3 text-sm font-semibold transition",
                y === Number(value.slice(0, 4)) ? "bg-navy-700 text-cream-100" : "text-ink hover:bg-navy-50",
                y === Number(today.slice(0, 4)) && "ring-2 ring-sun-500 ring-inset",
              )}
            >
              {y}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Ketik tanggal langsung, mis. "12/03/1990" atau "12 Maret 1990". */
function TypeDate({ onPick, min, max }: { onPick: (value: string) => void; min?: string; max?: string }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    if (!text.trim()) return;
    const parsed = parseDateCell(text, todayWib());
    if (!parsed.value) return setError("Tulis seperti 12/03/1990");
    if ((min && parsed.value < min) || (max && parsed.value > max)) return setError("Tanggal di luar batas");
    onPick(parsed.value);
  };
  return (
    <div className="border-t border-ink/8 p-3">
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          inputMode="numeric"
          placeholder="atau ketik 12/03/1990"
          aria-label="Ketik tanggal"
          className="min-w-0 flex-1 rounded-xl bg-cream-100 px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink-soft/60 focus:ring-2 focus:ring-navy-700/20"
        />
        <button type="button" onClick={submit} className="btn btn-navy px-4 py-2 text-sm">
          Pakai
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}

export function DateInput({
  name,
  id,
  value,
  defaultValue,
  onChange,
  required,
  min,
  max,
  placeholder = "Pilih tanggal",
  startView = "day",
  className,
  disabled,
  "aria-label": ariaLabel,
}: {
  name?: string;
  id?: string;
  value?: string;
  defaultValue?: string | null;
  onChange?: (value: string) => void;
  required?: boolean;
  min?: string;
  max?: string;
  placeholder?: string;
  /** "year" untuk tanggal lahir: pilih tahun dulu, lalu bulan, lalu tanggal. */
  startView?: View;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const [current, set, reset] = useControlled(value, defaultValue ?? "", onChange);
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useDismiss(open, [button, panel], () => setOpen(false));
  useFormReset(button, reset);

  const pick = (next: string) => {
    set(next);
    setOpen(false);
    button.current?.focus();
  };

  return (
    <div className={cn("relative w-full", className)}>
      <FormValue name={name} value={isValidDate(current) ? current : ""} required={required} />
      <button
        ref={button}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen(!open)}
        className={cn(trigger, open && "border-navy-700 ring-4 ring-navy-700/10")}
      >
        <span className={cn("truncate", !current && "text-ink-soft/70")}>{current ? formatCalendarDate(current) : placeholder}</span>
        <Icon.calendar className="h-[18px] w-[18px] shrink-0 text-ink-soft" />
      </button>

      <Popover open={open} anchor={button} panelRef={panel} onClose={() => setOpen(false)} title={ariaLabel ?? "Pilih tanggal"} minWidth={320}>
        <Calendar value={current} min={min} max={max} startView={startView} onPick={pick} />
        <TypeDate onPick={pick} min={min} max={max} />
        <div className="flex items-center justify-between gap-2 border-t border-ink/8 px-3 py-2.5">
          {!required && current ? (
            <button type="button" onClick={() => pick("")} className="rounded-full px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
              Kosongkan
            </button>
          ) : (
            <span />
          )}
          {(!max || todayWib() <= max) && (!min || todayWib() >= min) && (
            <button type="button" onClick={() => pick(todayWib())} className="rounded-full px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-50">
              Hari ini
            </button>
          )}
        </div>
      </Popover>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Jam
   ═══════════════════════════════════════════════════════════════════════════ */

const HOURS = Array.from({ length: 24 }, (_, h) => pad(h));
const MINUTES = Array.from({ length: 12 }, (_, i) => pad(i * 5));

function Column({ items, selected, onPick, label }: { items: string[]; selected: string; onPick: (v: string) => void; label: string }) {
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    list.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView({ block: "center" });
  }, []);
  return (
    <div className="min-w-0 flex-1">
      <p className="pb-1.5 text-center text-[11px] font-semibold text-ink-soft">{label}</p>
      <div ref={list} className="h-60 overflow-y-auto overscroll-contain rounded-xl bg-cream-50 p-1">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={item === selected}
            onClick={() => onPick(item)}
            className={cn(
              "tabular block w-full rounded-lg py-2.5 text-center text-[15px] font-semibold transition",
              item === selected ? "bg-navy-700 text-cream-100" : "text-ink hover:bg-navy-50",
            )}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TimeInput({
  name,
  id,
  value,
  defaultValue,
  onChange,
  required,
  placeholder = "Pilih jam",
  className,
  disabled,
  "aria-label": ariaLabel,
}: {
  name?: string;
  id?: string;
  value?: string;
  defaultValue?: string | null;
  onChange?: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const [current, set, reset] = useControlled(value, defaultValue?.slice(0, 5) ?? "", onChange);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useDismiss(open, [button, panel], () => setOpen(false));
  useFormReset(button, reset);

  const [hour, minute] = current ? current.split(":") : ["", ""];
  const update = (h: string, m: string) => set(`${h || "19"}:${m || "00"}`);
  const typed = () => {
    const match = text.trim().match(/^(\d{1,2})(?:[.:](\d{2}))?$/);
    if (!match || Number(match[1]) > 23 || Number(match[2] ?? 0) > 59) return;
    set(`${pad(Number(match[1]))}:${match[2] ?? "00"}`);
    setText("");
    setOpen(false);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <FormValue name={name} value={current} required={required} />
      <button
        ref={button}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen(!open)}
        className={cn(trigger, open && "border-navy-700 ring-4 ring-navy-700/10")}
      >
        <span className={cn("tabular truncate", !current && "text-ink-soft/70")}>{current ? `${current.replace(":", ".")} WIB` : placeholder}</span>
        <Icon.clock className="h-[18px] w-[18px] shrink-0 text-ink-soft" />
      </button>

      <Popover open={open} anchor={button} panelRef={panel} onClose={() => setOpen(false)} title={ariaLabel ?? "Pilih jam"} minWidth={260}>
        <div className="flex gap-2 p-3">
          <Column label="Jam" items={HOURS} selected={hour ?? ""} onPick={(h) => update(h, minute ?? "")} />
          <Column label="Menit" items={MINUTES.includes(minute ?? "") || !minute ? MINUTES : [...MINUTES, minute].sort()} selected={minute ?? ""} onPick={(m) => update(hour ?? "", m)} />
        </div>
        <div className="flex gap-2 border-t border-ink/8 p-3">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                typed();
              }
            }}
            inputMode="numeric"
            placeholder="atau ketik 19.30"
            aria-label="Ketik jam"
            className="min-w-0 flex-1 rounded-xl bg-cream-100 px-3.5 py-2.5 text-[15px] outline-none placeholder:text-ink-soft/60 focus:ring-2 focus:ring-navy-700/20"
          />
          <button type="button" onClick={() => (text ? typed() : setOpen(false))} className="btn btn-navy px-4 py-2 text-sm">
            {text ? "Pakai" : "Selesai"}
          </button>
        </div>
        {!required && current && (
          <div className="border-t border-ink/8 px-3 py-2.5">
            <button
              type="button"
              onClick={() => {
                set("");
                setOpen(false);
              }}
              className="rounded-full px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Kosongkan
            </button>
          </div>
        )}
      </Popover>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tanggal + jam
   ═══════════════════════════════════════════════════════════════════════════ */

/** Nilai form: "yyyy-mm-ddTHH:MM" (WIB), sama seperti datetime-local. */
export function DateTimeInput({
  name,
  id,
  defaultValue,
  required,
  hint,
}: {
  name: string;
  id?: string;
  defaultValue?: string | null;
  required?: boolean;
  hint?: ReactNode;
}) {
  const [date, setDate] = useState(defaultValue?.slice(0, 10) ?? "");
  const [time, setTime] = useState(defaultValue?.slice(11, 16) ?? "");
  const holder = useRef<HTMLDivElement>(null);
  useFormReset(holder, () => {
    setDate(defaultValue?.slice(0, 10) ?? "");
    setTime(defaultValue?.slice(11, 16) ?? "");
  });
  const complete = date && time ? `${date}T${time}` : "";
  const half = Boolean(date) !== Boolean(time);

  return (
    <div ref={holder} className="relative">
      <FormValue name={name} value={complete} required={required} />
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <DateInput id={id} value={date} onChange={setDate} aria-label="Tanggal" />
        <TimeInput value={time} onChange={setTime} aria-label="Jam" className="w-36" />
      </div>
      {half ? (
        <p className="mt-1.5 text-xs font-medium text-[#7a5a00]">{date ? "Pilih jamnya juga." : "Pilih tanggalnya juga."}</p>
      ) : (
        hint
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Angka
   ═══════════════════════════════════════════════════════════════════════════ */

/** Angka dengan tombol kurang/tambah besar, lebih mudah daripada panah kecil bawaan browser. */
export function NumberInput({
  name,
  id,
  defaultValue = 0,
  min = 0,
  max = 9999,
  step = 1,
  className,
  "aria-label": ariaLabel,
}: {
  name: string;
  id?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  "aria-label"?: string;
}) {
  const [value, setValue] = useState(String(defaultValue));
  const input = useRef<HTMLInputElement>(null);
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const bump = (delta: number) => {
    setValue(String(clamp((Number.parseInt(value, 10) || 0) + delta)));
    requestAnimationFrame(() => input.current?.dispatchEvent(new Event("input", { bubbles: true })));
  };
  useFormReset(input, () => setValue(String(defaultValue)));

  return (
    <div className={cn("flex w-full max-w-48 items-stretch overflow-hidden rounded-xl border border-ink/12 bg-white focus-within:border-navy-700 focus-within:ring-4 focus-within:ring-navy-700/10", className)}>
      <button type="button" onClick={() => bump(-step)} aria-label="Kurangi" className="grid w-12 shrink-0 place-items-center text-xl font-semibold text-navy-700 hover:bg-cream-100">
        −
      </button>
      <input
        ref={input}
        id={id}
        name={name}
        value={value}
        aria-label={ariaLabel}
        inputMode="numeric"
        pattern="-?[0-9]*"
        onChange={(event) => setValue(event.target.value.replace(/[^\d-]/g, ""))}
        onBlur={() => setValue(String(clamp(Number.parseInt(value, 10) || 0)))}
        className="tabular w-full min-w-0 border-x border-ink/8 py-3 text-center text-[15px] font-semibold text-ink outline-none"
      />
      <button type="button" onClick={() => bump(step)} aria-label="Tambah" className="grid w-12 shrink-0 place-items-center text-xl font-semibold text-navy-700 hover:bg-cream-100">
        +
      </button>
    </div>
  );
}
