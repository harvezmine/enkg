import type { LifeGroup } from "./db-types";

export const WEEKDAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

/** "Setiap Jumat · 19.30 WIB" dari hari & jam pertemuan Life Group. */
export function scheduleLabel(group: Pick<LifeGroup, "meeting_day" | "meeting_time">) {
  const day = group.meeting_day !== null ? `Setiap ${WEEKDAYS[group.meeting_day]}` : null;
  const time = group.meeting_time ? `${group.meeting_time.slice(0, 5).replace(":", ".")} WIB` : null;
  return [day, time].filter(Boolean).join(" · ") || "Jadwal belum tetap";
}
