import Link from "next/link";

import { DbError } from "@/components/admin/db-error";
import { PersonAvatar } from "@/components/admin/people/avatar";
import { AdminPageHeader, Badge, Card, EmptyState, SectionTitle } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { adminDb } from "@/lib/admin-auth";
import {
  SUBMISSION_FORM_LABEL,
  SUBMISSION_STATUS_LABEL,
  TABLES,
  type ContactSubmission,
  type Person,
  type Relationship,
} from "@/lib/db-types";
import { birthdayPhrase, formatDayMonth, nextBirthday, todayWib, upcomingBirthdays } from "@/lib/people";
import { selectAll, signPhotos } from "@/lib/people-data";
import { formatDateTime } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

/** Jendela pengingat ulang tahun di Ringkasan. */
const BIRTHDAY_DAYS = 14;

type BirthdayPerson = Pick<Person, "id" | "full_name" | "nickname" | "birth_date" | "photo_path" | "phone">;

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await adminDb();
  const head = (table: string) => supabase.from(table).select("id", { count: "exact", head: true });
  const now = new Date().toISOString();

  const [baru, drafts, posts, upcoming, procon, recent, people, waiting, withBirthday, marriages] = await Promise.all([
    head(TABLES.submissions).eq("status", "baru"),
    head(TABLES.posts).eq("published", false),
    head(TABLES.posts).eq("published", true),
    head(TABLES.events).eq("category", "gereja").eq("published", true).gte("starts_at", now),
    head(TABLES.events).eq("category", "procon").eq("published", true),
    supabase.from(TABLES.submissions).select("*").order("created_at", { ascending: false }).limit(5),
    head(TABLES.people).in("status", ["baru", "aktif"]),
    head(TABLES.people).eq("status", "baru").is("life_group_id", null),
    selectAll<BirthdayPerson>((from, to) =>
      supabase
        .from(TABLES.people)
        .select("id, full_name, nickname, birth_date, photo_path, phone")
        .not("birth_date", "is", null)
        .not("status", "in", "(pindah,tidak_aktif)")
        .order("id")
        .range(from, to),
    ),
    selectAll<Pick<Relationship, "id" | "person_id" | "relative_id" | "married_on">>((from, to) =>
      supabase
        .from(TABLES.relationships)
        .select("id, person_id, relative_id, married_on")
        .eq("kind", "pasangan")
        .not("married_on", "is", null)
        .order("id")
        .range(from, to),
    ),
  ]);

  // Tabel jemaat bisa belum dibuat walau News sudah jalan; jangan sampai Ringkasan ikut error.
  const error = [baru, drafts, posts, upcoming, procon, recent].find((result) => result.error)?.error;
  const today = todayWib();
  const birthdays = upcomingBirthdays(withBirthday.data, today, BIRTHDAY_DAYS);

  // Anniversary: pasangan yang tanggal menikahnya tercatat.
  const couples = marriages.data
    .map((rel) => ({ rel, next: nextBirthday(rel.married_on!, today) }))
    .filter(({ next }) => next.daysUntil <= BIRTHDAY_DAYS);
  const coupleIds = [...new Set(couples.flatMap(({ rel }) => [rel.person_id, rel.relative_id]))];
  const { data: coupleRows } = coupleIds.length
    ? await supabase.from(TABLES.people).select("id, full_name, nickname, birth_date, photo_path, phone").in("id", coupleIds)
    : { data: [] as BirthdayPerson[] };
  const byId = new Map(((coupleRows ?? []) as BirthdayPerson[]).map((p) => [p.id, p]));
  const short = (p: BirthdayPerson) => p.nickname || p.full_name.split(" ")[0]!;

  const celebrations = [
    ...birthdays.map(({ person, daysUntil, turning, date }) => ({
      key: `u-${person.id}`,
      kind: "ulang_tahun" as const,
      people: [person],
      title: person.full_name,
      daysUntil,
      turning,
      date,
      phone: person.phone,
      message: `Selamat ulang tahun, ${short(person)}! Tuhan memberkati dan menyertai kamu di tahun yang baru ini.`,
    })),
    ...couples.flatMap(({ rel, next }) => {
      const a = byId.get(rel.person_id);
      const b = byId.get(rel.relative_id);
      if (!a || !b) return [];
      return [
        {
          key: `a-${rel.id}`,
          kind: "anniversary" as const,
          people: [a, b],
          title: `${short(a)} & ${short(b)}`,
          daysUntil: next.daysUntil,
          turning: next.turning,
          date: next.date,
          phone: a.phone ?? b.phone,
          message: `Selamat ulang tahun pernikahan ke-${next.turning}, ${short(a)} & ${short(b)}! Tuhan terus memberkati keluarga kalian.`,
        },
      ];
    }),
  ].sort((x, y) => x.daysUntil - y.daysUntil || x.title.localeCompare(y.title, "id"));

  const photos = await signPhotos(supabase, celebrations.slice(0, 12).flatMap((item) => item.people.map((p) => p.photo_path)));
  const waitingCount = waiting.count ?? 0;
  const submissions = (recent.data ?? []) as ContactSubmission[];
  const newCount = baru.count ?? 0;

  const cards = [
    { label: "Kiriman baru", value: newCount, href: "/admin/kontak?status=baru", icon: Icon.inbox, urgent: newCount > 0 },
    { label: "Menunggu Life Group", value: waitingCount, href: "/admin/life-group", icon: Icon.home, urgent: waitingCount > 0 },
    { label: "Jemaat", value: people.count ?? 0, href: "/admin/jemaat", icon: Icon.addressBook },
    { label: "Ulang tahun", value: celebrations.length, href: "#ulang-tahun", icon: Icon.cake },
    { label: "News terbit", value: posts.count ?? 0, href: "/admin/news", icon: Icon.news },
    { label: "Draf News", value: drafts.count ?? 0, href: "/admin/news", icon: Icon.edit },
    { label: "Event mendatang", value: upcoming.count ?? 0, href: "/admin/event?kategori=gereja", icon: Icon.calendar },
    { label: "ProCon terbit", value: procon.count ?? 0, href: "/admin/event?kategori=procon", icon: Icon.users },
  ];

  return (
    <>
      <AdminPageHeader
        title="Ringkasan"
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/jemaat/baru" className="btn btn-navy px-4 py-2.5 text-sm">
              <Icon.plus className="h-4 w-4" /> Jemaat
            </Link>
            <Link href="/admin/news/baru" className="btn btn-outline px-4 py-2.5 text-sm">
              <Icon.plus className="h-4 w-4" /> News
            </Link>
            <Link href="/admin/event/baru" className="btn btn-outline px-4 py-2.5 text-sm">
              <Icon.plus className="h-4 w-4" /> Event
            </Link>
          </div>
        }
      />

      <DbError error={error} />

      {/* Satu panel, sel dipisah garis tipis: tidak ada kotak di dalam kotak. */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-ink/[0.07] shadow-hair ring-1 ring-ink/[0.07] sm:grid-cols-4">
        {cards.map(({ label, value, href, icon: CardIcon, urgent }) => (
          <Link
            key={label}
            href={href}
            className={`group flex flex-col gap-1.5 p-4 transition-colors sm:p-5 ${urgent ? "bg-[#fff7e1] hover:bg-[#fef2ce]" : "bg-white hover:bg-cream-50"}`}
          >
            <span className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
              <CardIcon className={`h-4 w-4 shrink-0 ${urgent ? "text-[#8a6500]" : "text-navy-700/70"}`} />
              <span className="truncate">{label}</span>
            </span>
            <span className="font-display tabular text-2xl leading-none font-bold text-ink sm:text-[1.75rem]">{value}</span>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 xl:grid-cols-2 xl:gap-8">
      {celebrations.length > 0 && (
        <section id="ulang-tahun" className="scroll-mt-24">
          <SectionTitle>Ulang tahun & anniversary</SectionTitle>
          <Card>
            <ul className="divide-y divide-ink/[0.06]">
              {celebrations.slice(0, 12).map((item) => (
                <li key={item.key} className={`flex items-center gap-3 px-4 py-3 ${item.daysUntil === 0 ? "bg-[#fff7e1]" : ""}`}>
                  <span className="relative flex shrink-0">
                    {item.people.map((person, index) => (
                      <PersonAvatar
                        key={person.id}
                        person={person}
                        photoUrl={person.photo_path ? photos.get(person.photo_path) : null}
                        className={`h-11 w-11 rounded-full text-sm ring-2 ring-white ${index ? "-ml-4" : ""}`}
                      />
                    ))}
                    <span
                      className={`absolute -right-1 -bottom-1 grid h-5 w-5 place-items-center rounded-full ring-2 ring-white ${item.kind === "anniversary" ? "bg-navy-700 text-cream-100" : "bg-sun-500 text-ink"}`}
                    >
                      {item.kind === "anniversary" ? <Icon.heart className="h-3 w-3" /> : <Icon.cake className="h-3 w-3" />}
                    </span>
                  </span>
                  <Link href={`/admin/jemaat/${item.people[0]!.id}`} className="min-w-0 flex-1 py-1">
                    <span className="block truncate text-sm font-semibold text-ink hover:underline">{item.title}</span>
                    <span className="block truncate text-xs text-ink-soft">
                      {birthdayPhrase(item.daysUntil)} · {formatDayMonth(item.date).replace(/^(\d+ \S{3})\S*/, "$1")} ·{" "}
                      {item.kind === "anniversary" ? `${item.turning} tahun menikah` : `ke-${item.turning}`}
                    </span>
                  </Link>
                  {item.phone && (
                    <a
                      href={whatsappLink(item.phone, item.message)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Kirim ucapan ke ${item.title}`}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                    >
                      <Icon.whatsapp className="h-4 w-4" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </Card>
          {celebrations.length > 12 && <p className="mt-3 text-sm text-ink-soft">Dan {celebrations.length - 12} lagi.</p>}
        </section>
      )}

      <section>
        <SectionTitle
          action={
            <Link href="/admin/kontak" className="-mr-2 inline-flex h-10 shrink-0 items-center rounded-full px-2 text-sm font-semibold text-navy-700">
              Lihat semua
            </Link>
          }
        >
          Kiriman terbaru
        </SectionTitle>

        {submissions.length ? (
          <Card>
            <ul className="divide-y divide-ink/[0.06]">
              {submissions.map((item) => (
                <li key={item.id}>
                  <Link href={`/admin/kontak?status=${item.status}`} className="block px-4 py-3.5 transition-colors hover:bg-cream-50">
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate font-semibold text-ink">{item.name}</span>
                      <Badge tone={item.status === "baru" ? "sun" : item.status === "selesai" ? "green" : "gray"}>
                        {SUBMISSION_STATUS_LABEL[item.status]}
                      </Badge>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-soft">
                      {[
                        SUBMISSION_FORM_LABEL[item.form],
                        formatDateTime(item.created_at),
                        item.form === "prayer" ? item.request : [item.life_group, item.domicile].filter(Boolean).join(", "),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          !error && <EmptyState title="Belum ada kiriman" />
        )}
      </section>
      </div>
    </>
  );
}
