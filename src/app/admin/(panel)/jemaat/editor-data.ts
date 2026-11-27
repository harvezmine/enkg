import "server-only";

import type { Directory } from "@/lib/people-data";

/** Saran isian wilayah dari data yang sudah ada, supaya penulisannya seragam. */
export function editorOptions(dir: Directory) {
  const areas = [...new Set(dir.people.map((p) => p.area).filter((v): v is string => Boolean(v)))].sort((a, b) =>
    a.localeCompare(b, "id"),
  );
  const lifeGroups = dir.lifeGroups
    .filter((group) => group.is_active)
    .map(({ id, name, segment }) => ({ id, name, segment }));
  return { areas: areas.length ? areas : ["Kelapa Gading"], lifeGroups };
}
