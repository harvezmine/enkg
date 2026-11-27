import type { Person } from "@/lib/db-types";
import { initials, toneIndex } from "@/lib/people";
import { cn } from "@/lib/utils";

/** Warna avatar inisial, semua dari palet situs. Pilihannya tetap per orang. */
const TONES = [
  "bg-navy-100 text-navy-800",
  "bg-sun-300/55 text-navy-900",
  "bg-cream-200 text-navy-800",
  "bg-navy-50 text-navy-600",
  "bg-sun-400/20 text-navy-800",
  "bg-navy-700 text-cream-100",
] as const;

/**
 * Foto jemaat, atau inisial berwarna kalau belum ada foto. `img` biasa, bukan
 * next/image: fotonya signed URL dari bucket privat yang berganti tiap muat.
 */
export function PersonAvatar({
  person,
  photoUrl,
  className,
}: {
  person: Pick<Person, "id" | "full_name">;
  photoUrl?: string | null;
  className?: string;
}) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt="" loading="lazy" decoding="async" className={cn("object-cover", className)} />;
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "font-display grid place-items-center font-bold tracking-tight select-none",
        TONES[toneIndex(person.id, TONES.length)],
        className,
      )}
    >
      {initials(person.full_name)}
    </span>
  );
}
