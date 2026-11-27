import Link from "next/link";

import { DbError } from "@/components/admin/db-error";
import { GettingStarted, type StartStep } from "@/components/admin/getting-started";
import { PersonAvatar } from "@/components/admin/people/avatar";
import { AdminPageHeader, Badge, Card, EmptyState } from "@/components/admin/ui";
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

  const [photos, setup] = await Promise.all([
    signPhotos(supabase, celebrations.slice(0, 12).flatMap((item) => item.people.map((p) => p.photo_path))),
    setupProgress(supabase),
  ]);
  const waitingCount = waiting.count ?? 0;
  const submissions = (recent.data ?? []) as ContactSubmission[];
  const newCount = baru.count ?? 0;

  const cards = [
    { label: "Kiriman baru", value: newCount, href: "/admin/kontak?status=baru", icon: Icon.inbox, urgent: newCount > 0 },
    { label: "Menunggu Life Group", value: waitingCount, href: "/admin/life-group", icon: Icon.home, urgent: waitingCount > 0 },
    { label: "Jemaat aktif & baru", value: people.count ?? 0, href: "/admin/jemaat", icon: Icon.addressBook },
    { label: `Ulang tahun & anniversary ${BIRTHDAY_DAYS} hari`, value: celebrations.length, href: "#ulang-tahun", icon: Icon.cake },
    { label: "News terbit", value: posts.count ?? 0, href: "/admin/news", icon: Icon.news },
    { label: "Draf News", value: drafts.count ?? 0, href: "/admin/news", icon: Icon.edit },
    { label: "Event mendatang", value: upcoming.count ?? 0, href: "/admin/event?kategori=gereja", icon: Icon.calendar },
    { label: "ProCon terbit", value: procon.count ?? 0, href: "/admin/event?kategori=procon", icon: Icon.users },
  ];

  return (
    <>
      <AdminPageHeader
        title="Ringkasan"
        description="Tanggapi kiriman dan jemaat baru dulu, lalu perbarui isi situs."
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

      <GettingStarted steps={setup} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
        {cards.map(({ label, value, href, icon: CardIcon, urgent }) => (
          <Link key={label} href={href} className="group">
            <Card className={`h-full p-5 transition hover:-translate-y-0.5 hover:shadow-lift ${urgent ? "bg-sun-400/15 ring-sun-500/40" : ""}`}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy-50 text-navy-700 transition-colors group-hover:bg-navy-700 group-hover:text-cream-100">
                <CardIcon className="h-5 w-5" />
              </span>
              <p className="font-display tabular mt-4 text-3xl font-bold text-ink">{value}</p>
              <p className="mt-1 text-xs font-medium text-ink-soft">{label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {celebrations.length > 0 && (
        <section id="ulang-tahun" className="mt-10 scroll-mt-24">
          <h2 className="font-display mb-4 text-xl font-bold text-ink">Ulang tahun & anniversary {BIRTHDAY_DAYS} hari ke depan</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {celebrations.slice(0, 12).map((item) => (
              <li key={item.key}>
                <Card className={`flex h-full items-center gap-3 p-3.5 ${item.daysUntil === 0 ? "bg-sun-400/15 ring-sun-500/40" : ""}`}>
                  <span className="relative flex shrink-0">
                    {item.people.map((person, index) => (
                      <PersonAvatar
                        key={person.id}
                        person={person}
                        photoUrl={person.photo_path ? photos.get(person.photo_path) : null}
                        className={`h-12 w-12 rounded-full text-sm ring-2 ring-white ${index ? "-ml-4" : ""}`}
                      />
                    ))}
                    <span
                      className={`absolute -right-1 -bottom-1 grid h-6 w-6 place-items-center rounded-full ring-2 ring-white ${item.kind === "anniversary" ? "bg-navy-700 text-cream-100" : "bg-sun-500 text-ink"}`}
                    >
                      {item.kind === "anniversary" ? <Icon.heart className="h-3.5 w-3.5" /> : <Icon.cake className="h-3.5 w-3.5" />}
                    </span>
                  </span>
                  <Link href={`/admin/jemaat/${item.people[0]!.id}`} className="min-w-0 flex-1">
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
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                    >
                      <Icon.whatsapp className="h-4 w-4" />
                    </a>
                  )}
                </Card>
              </li>
            ))}
          </ul>
          {celebrations.length > 12 && (
            <p className="mt-3 text-sm text-ink-soft">Dan {celebrations.length - 12} lagi. Lihat lewat filter bulan lahir di Data jemaat.</p>
          )}
        </section>
      )}

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-bold text-ink">Kiriman Contact Us terbaru</h2>
          <Link href="/admin/kontak" className="shrink-0 text-sm font-semibold text-navy-700">
            Lihat semua
          </Link>
        </div>

        {submissions.length ? (
          <ul className="space-y-3">
            {submissions.map((item) => (
              <li key={item.id}>
                <Link href={`/admin/kontak?status=${item.status}`}>
                  <Card className="p-4 transition hover:shadow-lift sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={item.status === "baru" ? "sun" : item.status === "selesai" ? "green" : "gray"}>
                        {SUBMISSION_STATUS_LABEL[item.status]}
                      </Badge>
                      <Badge tone="navy">{SUBMISSION_FORM_LABEL[item.form]}</Badge>
                      <span className="text-xs text-ink-soft">{formatDateTime(item.created_at)}</span>
                    </div>
                    <p className="mt-2 font-semibold text-ink">{item.name}</p>
                    <p className="mt-0.5 line-clamp-1 text-sm text-ink-soft">
                      {item.form === "prayer"
                        ? item.request
                        : [item.life_group, item.age_range, item.domicile].filter(Boolean).join(" · ")}
                    </p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          !error && (
            <EmptyState
              title="Belum ada kiriman"
              description="Pendaftaran Life Group dan permohonan doa dari situs akan muncul di sini."
            />
          )
        )}
      </section>
    </>
  );
}

type Db = Awaited<ReturnType<typeof adminDb>>;

/**
 * Kemajuan langkah awal untuk daftar "Mulai dari sini". Setiap hitungan
 * dibaca terpisah dan kegagalannya diabaikan: tabel yang belum ada (mis. bot
 * Telegram belum disiapkan) cukup dianggap belum selesai.
 */
async function setupProgress(supabase: Db): Promise<StartStep[]> {
  const count = async (run: () => PromiseLike<{ count: number | null; error: unknown }>) => {
    try {
      const { count: value, error } = await run();
      return error ? 0 : (value ?? 0);
    } catch {
      return 0;
    }
  };
  const head = (table: string) => supabase.from(table).select("id", { count: "exact", head: true });

  const [groups, people, leaders, accounts, servants, telegram, schedule] = await Promise.all([
    count(() => head(TABLES.lifeGroups)),
    count(() => head(TABLES.people)),
    count(() => head(TABLES.people).eq("life_group_role", "leader").not("life_group_id", "is", null)),
    count(() => head(TABLES.accounts)),
    count(() => head(TABLES.teamMembers)),
    count(() => head("enkg_telegram_chats").not("chat_id", "is", null)),
    // Jadwal dianggap sudah dicek kalau pernah diubah atau ditambah dari admin
    // (jadwal bawaan dari schema.sql punya slug dan belum pernah diubah).
    (async () => {
      try {
        const { data } = await supabase.from(TABLES.schedule).select("slug, created_at, updated_at");
        return (data ?? []).some(
          (row) => !row.slug || new Date(row.updated_at).getTime() - new Date(row.created_at).getTime() > 2000,
        )
          ? 1
          : 0;
      } catch {
        return 0;
      }
    })(),
  ]);

  return [
    {
      key: "life-group",
      title: "Buat Life Group",
      description: "Daftarkan kelompok kecil yang sudah berjalan, lengkap dengan hari dan jam pertemuannya.",
      href: "/admin/life-group?baru=1",
      cta: "Buat Life Group",
      done: groups > 0,
    },
    {
      key: "jemaat",
      title: "Isi data jemaat",
      description: "Tambah satu per satu, atau unggah file Excel yang sudah kamu punya. Data ini hanya bisa dilihat pengurus.",
      href: people > 0 ? "/admin/jemaat" : "/admin/jemaat/impor",
      cta: people > 0 ? "Lihat data jemaat" : "Impor dari Excel",
      done: people > 0,
    },
    {
      key: "leader",
      title: "Tunjuk leader tiap Life Group",
      description: "Buka Life Group, lalu masukkan leadernya. Leader inilah yang nanti mendampingi jemaat baru.",
      href: "/admin/life-group",
      cta: "Atur leader",
      done: leaders > 0,
    },
    {
      key: "akun-leader",
      title: "Buatkan akun portal untuk leader",
      description: "Buka data leader, lalu tekan Buat akun portal. Password sementaranya bisa langsung dikirim lewat WhatsApp.",
      href: "/admin/life-group",
      cta: "Pilih leader",
      done: accounts > 0,
    },
    {
      key: "pelayanan",
      title: "Isi tim pelayanan",
      description: "Masukkan siapa saja yang melayani: musisi, singer, usher, multimedia, dan lainnya.",
      href: "/admin/pelayanan",
      cta: "Buka Pelayanan",
      done: servants > 0,
    },
    {
      key: "kalender",
      title: "Cek jadwal di kalender",
      description: "Pastikan jam ibadah dan doa sudah benar. Jadwal ini tampil di halaman utama situs.",
      href: "/admin/kalender",
      cta: "Buka Kalender",
      done: schedule > 0,
      confirmable: true,
    },
    {
      key: "telegram",
      title: "Sambungkan bot Telegram",
      description: "Pengingat ulang tahun, anniversary, dan jemaat baru dikirim ke Telegram pengurus setiap pagi.",
      href: "/admin/telegram",
      cta: "Atur Telegram",
      done: telegram > 0,
    },
  ];
}
