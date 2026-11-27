"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

import { Popover, useDismiss } from "./popover";

type Option = { value: string; label: string; disabled: boolean };

const textOf = (node: ReactNode): string =>
  Children.toArray(node)
    .map((child) => (typeof child === "string" || typeof child === "number" ? String(child) : isValidElement(child) ? textOf((child.props as { children?: ReactNode }).children) : ""))
    .join("");

function readOptions(children: ReactNode): Option[] {
  const options: Option[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const element = child as ReactElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>;
    if (element.type === "option") {
      const label = textOf(element.props.children);
      options.push({ value: String(element.props.value ?? label), label, disabled: Boolean(element.props.disabled) });
    } else if (element.type === "optgroup") {
      options.push(...readOptions(element.props.children));
    }
  });
  return options;
}

const fold = (value: string) =>
  value
    .toLocaleLowerCase("id")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** Daftar panjang (mis. Life Group) mendapat kotak cari di atasnya. */
const SEARCH_FROM = 9;

type SelectProps = Omit<ComponentProps<"select">, "onChange" | "value" | "defaultValue"> & {
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
};

/**
 * Dropdown custom pengganti <select>. Pemakaiannya sama persis dengan
 * <select> biasa (anak <option>, name, value/defaultValue, onChange,
 * required), jadi form yang ada tidak perlu diubah. Di belakangnya tetap ada
 * <select> asli yang tersembunyi untuk pengiriman form, validasi wajib isi,
 * dan reset form.
 */
export function Select({ children, className, value, defaultValue, onChange, id, disabled, required, name, ...rest }: SelectProps) {
  const options = useMemo(() => readOptions(children), [children]);
  const initial = () => String(value ?? defaultValue ?? options[0]?.value ?? "");
  const [internal, setInternal] = useState(initial);
  const current = value !== undefined ? String(value) : internal;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");
  const native = useRef<HTMLSelectElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const listId = `${id ?? autoId}-list`;

  const selected = options.find((option) => option.value === current);
  const placeholder = selected?.value === "" ? selected.label : null;
  const searchable = options.length >= SEARCH_FROM;
  const visible = query
    ? options.filter((option) => option.value !== "" && fold(option.label).includes(fold(query.trim())))
    : options.filter((option) => !(option.value === "" && option.disabled));

  // Form di-reset (mis. React 19 setelah action): kembali ke nilai awal.
  useEffect(() => {
    const form = native.current?.form;
    if (!form || value !== undefined) return;
    const reset = () => setInternal(String(defaultValue ?? options[0]?.value ?? ""));
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [defaultValue, options, value]);

  useDismiss(open, [trigger, panel], () => setOpen(false));

  const openList = () => {
    if (disabled) return;
    setQuery("");
    setActive(Math.max(0, visible.findIndex((option) => option.value === current)));
    setOpen(true);
  };

  const choose = (option: Option) => {
    if (option.disabled) return;
    setOpen(false);
    trigger.current?.focus();
    if (option.value === current) return;
    if (value === undefined) setInternal(option.value);
    const select = native.current;
    if (select) {
      select.value = option.value;
      // Supaya pendengar biasa (mis. penanda "belum disimpan") ikut tahu ada perubahan.
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    onChange?.({ target: select ?? { value: option.value, name }, currentTarget: select } as ChangeEvent<HTMLSelectElement>);
  };

  const move = (delta: number) => {
    if (!visible.length) return;
    let next = active;
    for (let i = 0; i < visible.length; i++) {
      next = (next + delta + visible.length) % visible.length;
      if (!visible[next]!.disabled) break;
    }
    setActive(next);
    document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: "nearest" });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openList();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (visible[active]) choose(visible[active]!);
    } else if (event.key === "Tab") {
      setOpen(false);
    } else if (!searchable && event.key.length === 1) {
      // Ketik huruf pertama untuk lompat ke pilihan itu.
      const index = visible.findIndex((option) => fold(option.label).startsWith(fold(event.key)));
      if (index >= 0) setActive(index);
    }
  };

  return (
    <div className={cn("relative", className?.includes("w-auto") ? "w-full sm:w-auto" : "w-full")}>
      <select
        ref={native}
        name={name}
        value={current}
        onChange={() => {}}
        required={required}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-4 h-px w-px opacity-0"
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        ref={trigger}
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-label={rest["aria-label"]}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl border border-ink/12 bg-white px-4 py-3 text-left text-[15px] text-ink outline-none transition hover:border-ink/25 focus-visible:border-navy-700 focus-visible:ring-4 focus-visible:ring-navy-700/10 disabled:opacity-60",
          open && "border-navy-700 ring-4 ring-navy-700/10",
          className,
        )}
      >
        <span className={cn("min-w-0 truncate", placeholder !== null && "text-ink-soft/70")}>{selected?.label ?? "Pilih"}</span>
        <Icon.chevronDown className={cn("h-4 w-4 shrink-0 text-ink-soft transition-transform", open && "rotate-180")} />
      </button>

      <Popover open={open} anchor={trigger} panelRef={panel} onClose={() => setOpen(false)} title={rest["aria-label"] ?? placeholder ?? undefined}>
        {searchable && (
          <div className="border-b border-ink/8 p-2">
            <div className="relative">
              <Icon.search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-soft" />
              <input
                autoFocus
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Cari…"
                aria-label="Cari pilihan"
                className="w-full rounded-lg bg-cream-100 py-2.5 pr-3 pl-9 text-[15px] text-ink outline-none placeholder:text-ink-soft/60 focus:ring-2 focus:ring-navy-700/20"
              />
            </div>
          </div>
        )}
        <ul id={listId} role="listbox" className="max-h-72 overflow-y-auto overscroll-contain p-1.5 sm:max-h-80">
          {visible.length ? (
            visible.map((option, index) => {
              const isSelected = option.value === current;
              return (
                <li
                  key={option.value}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(option)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-[15px] sm:py-2.5",
                    option.disabled && "cursor-default text-ink-soft/50",
                    !option.disabled && index === active && "bg-navy-50",
                    isSelected ? "font-semibold text-navy-800" : "text-ink",
                  )}
                >
                  <span className="min-w-0">{option.label}</span>
                  {isSelected && <Icon.check className="h-4 w-4 shrink-0 text-navy-700" />}
                </li>
              );
            })
          ) : (
            <li className="px-3.5 py-3 text-sm text-ink-soft">Tidak ada yang cocok.</li>
          )}
        </ul>
      </Popover>
    </div>
  );
}
