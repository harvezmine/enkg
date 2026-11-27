"use client";

import { useId, useMemo, useState } from "react";

import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

import { PersonAvatar } from "./avatar";

export type PickerOption = {
  id: string;
  name: string;
  /** Baris kedua: panggilan, umur, wilayah. */
  detail?: string;
  photoUrl?: string | null;
  /** Teks tambahan yang ikut dicari, mis. nomor WA. */
  keywords?: string;
};

const fold = (value: string) =>
  value
    .toLocaleLowerCase("id")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const MAX_RESULTS = 8;

/**
 * Pilih satu orang dari database dengan mengetik namanya. Daftar jemaat bisa
 * ratusan, jadi <select> biasa terlalu panjang untuk digulir di HP.
 */
export function PersonPicker({
  name,
  options,
  placeholder = "Ketik nama…",
  inputId,
}: {
  name: string;
  options: PickerOption[];
  placeholder?: string;
  inputId?: string;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PickerOption | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const matches = useMemo(() => {
    const words = fold(query.trim()).split(/\s+/).filter(Boolean);
    if (!words.length) return options.slice(0, MAX_RESULTS);
    return options
      .filter((option) => {
        const haystack = fold(`${option.name} ${option.detail ?? ""} ${option.keywords ?? ""}`);
        return words.every((word) => haystack.includes(word));
      })
      .slice(0, MAX_RESULTS);
  }, [options, query]);

  const choose = (option: PickerOption) => {
    setSelected(option);
    setQuery("");
    setOpen(false);
  };

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-navy-700 bg-navy-50/50 py-2 pr-2 pl-2.5">
        <input type="hidden" name={name} value={selected.id} />
        <PersonAvatar person={{ id: selected.id, full_name: selected.name }} photoUrl={selected.photoUrl} className="h-9 w-9 shrink-0 rounded-full text-xs" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{selected.name}</span>
          {selected.detail && <span className="block truncate text-xs text-ink-soft">{selected.detail}</span>}
        </span>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-navy-700 transition hover:bg-white"
        >
          Ganti
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input type="hidden" name={name} value="" />
      <Icon.search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-soft" />
      <input
        id={inputId}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && matches[active] ? `${listId}-${matches[active].id}` : undefined}
        value={query}
        placeholder={placeholder}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        // Jeda kecil supaya klik pada pilihan sempat terbaca sebelum daftar ditutup.
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActive((index) => Math.min(index + 1, matches.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, 0));
          } else if (event.key === "Enter" && open && matches[active]) {
            event.preventDefault();
            choose(matches[active]);
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        className="w-full rounded-xl border border-ink/12 bg-white py-3 pr-4 pl-10 text-[15px] text-ink outline-none transition placeholder:text-ink-soft/50 hover:border-ink/25 focus:border-navy-700 focus:ring-4 focus:ring-navy-700/10"
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1.5 max-h-80 overflow-y-auto rounded-xl bg-white p-1.5 shadow-lift ring-1 ring-ink/10"
        >
          {matches.length ? (
            matches.map((option, index) => (
              <li
                key={option.id}
                id={`${listId}-${option.id}`}
                role="option"
                aria-selected={index === active}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
                onMouseEnter={() => setActive(index)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2",
                  index === active ? "bg-navy-50" : "hover:bg-cream-100",
                )}
              >
                <PersonAvatar
                  person={{ id: option.id, full_name: option.name }}
                  photoUrl={option.photoUrl}
                  className="h-8 w-8 shrink-0 rounded-full text-[11px]"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{option.name}</span>
                  {option.detail && <span className="block truncate text-xs text-ink-soft">{option.detail}</span>}
                </span>
              </li>
            ))
          ) : (
            <li className="px-3 py-3 text-sm text-ink-soft">Tidak ada yang cocok dengan &ldquo;{query}&rdquo;.</li>
          )}
        </ul>
      )}
    </div>
  );
}
