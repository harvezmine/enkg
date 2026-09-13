"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/** Saklar terbit/draf. Nilainya dikirim sebagai checkbox biasa ("on"). */
export function PublishToggle({
  name,
  defaultChecked = false,
  label = "Terbitkan",
  description,
}: {
  name: string;
  defaultChecked?: boolean;
  label?: string;
  description?: string;
}) {
  const [on, setOn] = useState(defaultChecked);

  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-ink/10">
      <input type="checkbox" name={name} checked={on} onChange={(event) => setOn(event.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sun-500",
          on ? "bg-navy-700" : "bg-ink/15",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300",
            on ? "translate-x-5.5" : "translate-x-0.5",
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="block text-xs text-ink-soft">{description}</span>}
      </span>
    </label>
  );
}
