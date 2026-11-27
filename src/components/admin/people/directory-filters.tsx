"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Icon } from "@/components/icons";
import { PERSON_STATUS_LABEL } from "@/lib/db-types";
import { monthName } from "@/lib/people";
import { cn } from "@/lib/utils";

import { Select } from "../ui";

export type DirectoryFilterValues = { q: string; status: string; tim: string; lg: string; bulan: string };

/**
 * Pencarian & filter jemaat lewat query string, jadi hasilnya bisa dibagikan
 * sebagai tautan dan tetap jalan tanpa JavaScript (form GET biasa). Dengan
 * JavaScript, ketikan dicari otomatis setelah jeda singkat.
 */
export function DirectoryFilters({
  values,
  teams,
  lifeGroups,
}: {
  values: DirectoryFilterValues;
  teams: { id: string; name: string }[];
  lifeGroups: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  // Disimpan lokal supaya pilihan langsung berubah, tidak menunggu navigasi selesai.
  const [current, setCurrent] = useState(values);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const go = (next: Partial<DirectoryFilterValues>) => {
    const merged = { ...current, ...next };
    setCurrent(merged);
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) if (value) params.set(key, value);
    const search = params.toString();
    startTransition(() => router.replace(`${pathname}${search ? `?${search}` : ""}`, { scroll: false }));
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  const hasFilter = Boolean(current.q || current.status || current.tim || current.lg || current.bulan);

  return (
    <form
      action={pathname}
      onSubmit={(event) => {
        event.preventDefault();
        clearTimeout(timer.current);
        go({ q: current.q });
      }}
      className={cn("mb-6 space-y-3 transition-opacity", pending && "opacity-70")}
      role="search"
    >
      <div className="relative">
        <Icon.search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-ink-soft" />
        <input
          type="search"
          name="q"
          value={current.q}
          onChange={(event) => {
            const value = event.target.value;
            setCurrent((prev) => ({ ...prev, q: value }));
            clearTimeout(timer.current);
            timer.current = setTimeout(() => go({ q: value }), 300);
          }}
          placeholder="Cari nama, panggilan, wilayah, atau nomor WA"
          aria-label="Cari jemaat"
          className="w-full rounded-full border border-ink/12 bg-white py-3.5 pr-5 pl-12 text-[15px] text-ink shadow-soft outline-none transition placeholder:text-ink-soft/60 hover:border-ink/25 focus:border-navy-700 focus:ring-4 focus:ring-navy-700/10"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center [&>select]:min-w-0">
        <Select
          name="status"
          aria-label="Status"
          value={current.status}
          onChange={(event) => go({ status: event.target.value })}
          className="rounded-full py-2.5 text-sm sm:w-auto"
        >
          <option value="">Status</option>
          {Object.entries(PERSON_STATUS_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          name="tim"
          aria-label="Pelayanan"
          value={current.tim}
          onChange={(event) => go({ tim: event.target.value })}
          className="rounded-full py-2.5 text-sm sm:w-auto"
        >
          <option value="">Pelayanan</option>
          <option value="pelayan">Semua pelayan</option>
          <option value="bukan">Belum melayani</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </Select>
        <Select
          name="lg"
          aria-label="Life Group"
          value={current.lg}
          onChange={(event) => go({ lg: event.target.value })}
          className="rounded-full py-2.5 text-sm sm:w-auto"
        >
          <option value="">Life Group</option>
          <option value="belum">Belum punya Life Group</option>
          {lifeGroups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </Select>
        <Select
          name="bulan"
          aria-label="Bulan lahir"
          value={current.bulan}
          onChange={(event) => go({ bulan: event.target.value })}
          className="rounded-full py-2.5 text-sm sm:w-auto"
        >
          <option value="">Bulan lahir</option>
          {Array.from({ length: 12 }, (_, index) => (
            <option key={index + 1} value={String(index + 1)}>
              Lahir {monthName(index + 1)}
            </option>
          ))}
        </Select>
        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              clearTimeout(timer.current);
              setCurrent({ q: "", status: "", tim: "", lg: "", bulan: "" });
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-navy-700 hover:bg-white"
          >
            Hapus filter
          </button>
        )}
        <noscript>
          <button type="submit" className="btn btn-navy px-4 py-2.5 text-sm">
            Terapkan
          </button>
        </noscript>
      </div>
    </form>
  );
}
