-- ═══════════════════════════════════════════════════════════════════════════
--  Every Nation Kelapa Gading — skema database admin panel
--
--  Jalankan di Supabase → SQL Editor → tempel seluruh isi file → Run.
--  Aman dijalankan ulang.
--
--  Semua tabel berawalan enkg_ supaya bisa berbagi satu project Supabase dengan
--  situs lain (mis. Janji Pengharapan) tanpa bentrok nama tabel.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── News: kabar & artikel ────────────────────────────────────────────────────
create table if not exists enkg_posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  excerpt      text,
  body         text,
  cover_url    text,
  category     text not null default 'kabar' check (category in ('kabar', 'artikel')),
  author       text,
  published    boolean not null default false,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists enkg_posts_published_idx on enkg_posts (published, published_at desc);

-- ── Event gereja & ProCon ────────────────────────────────────────────────────
create table if not exists enkg_events (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  description  text,
  category     text not null default 'gereja' check (category in ('gereja', 'procon')),
  topic        text,
  partner      text,
  starts_at    timestamptz,          -- boleh kosong untuk ProCon "Segera hadir"
  ends_at      timestamptz,
  location     text,
  address      text,
  map_url      text,
  cover_url    text,
  register_url text,
  published    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists enkg_events_category_idx on enkg_events (category, published, starts_at);

-- ── Kiriman form Contact Us (Life Group & Permohonan Doa) ────────────────────
create table if not exists enkg_contact_submissions (
  id          uuid primary key default gen_random_uuid(),
  form        text not null check (form in ('lifeGroup', 'prayer')),
  name        text not null,
  gender      text,
  phone       text not null,
  domicile    text,
  age_range   text,
  life_group  text,
  request     text,
  status      text not null default 'baru' check (status in ('baru', 'dihubungi', 'selesai')),
  admin_notes text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists enkg_submissions_status_idx on enkg_contact_submissions (status, created_at desc);

-- ═══════════════════════════════════════════════════════════════════════════
--  Row Level Security
--  Publik (anon key) hanya boleh MEMBACA konten yang sudah terbit.
--  Admin panel & penyimpanan form memakai service-role key yang melewati RLS,
--  jadi kiriman form tidak bisa dibaca dari luar dan tidak perlu policy tulis.
-- ═══════════════════════════════════════════════════════════════════════════
alter table enkg_posts               enable row level security;
alter table enkg_events              enable row level security;
alter table enkg_contact_submissions enable row level security;

drop policy if exists "enkg public read published posts" on enkg_posts;
create policy "enkg public read published posts" on enkg_posts for select using (published);

drop policy if exists "enkg public read published events" on enkg_events;
create policy "enkg public read published events" on enkg_events for select using (published);

-- ── Storage untuk gambar sampul ──────────────────────────────────────────────
-- Bucket publik: gambar bisa dibuka lewat URL publik; unggahan lewat service role.
insert into storage.buckets (id, name, public)
values ('enkg-media', 'enkg-media', true)
on conflict (id) do nothing;

-- ── updated_at otomatis ──────────────────────────────────────────────────────
create or replace function enkg_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists enkg_posts_touch on enkg_posts;
create trigger enkg_posts_touch before update on enkg_posts
  for each row execute function enkg_touch_updated_at();

drop trigger if exists enkg_events_touch on enkg_events;
create trigger enkg_events_touch before update on enkg_events
  for each row execute function enkg_touch_updated_at();

drop trigger if exists enkg_submissions_touch on enkg_contact_submissions;
create trigger enkg_submissions_touch before update on enkg_contact_submissions
  for each row execute function enkg_touch_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
--  Database jemaat & pelayanan (INTERNAL)
--
--  Data pribadi jemaat: tanggal lahir, alamat, nomor WA, foto. Tidak pernah
--  dibaca situs publik. RLS menyala TANPA policy apa pun, jadi anon key tidak
--  bisa membaca atau menulis satu baris pun; hanya admin panel (service role).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Life Group ───────────────────────────────────────────────────────────────
-- Leader dan anggotanya dicatat di enkg_people (life_group_id + life_group_role).
create table if not exists enkg_life_groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  segment      text check (segment in ('family', 'young_professional', 'youth')),
  description  text,
  meeting_day  smallint check (meeting_day between 0 and 6),   -- 0 = Minggu
  meeting_time time,
  location     text,                -- INTERNAL: bisa alamat rumah anggota, tidak pernah tampil publik
  area         text,                -- wilayah singkat yang aman ditampilkan, mis. "Kelapa Gading"
  -- Pertemuan grup ini tampil di kalender publik (nama, jam, dan wilayah saja).
  show_on_calendar boolean not null default true,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Jemaat ───────────────────────────────────────────────────────────────────
create table if not exists enkg_people (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  nickname    text,
  gender      text check (gender in ('L', 'P')),
  birth_place text,
  birth_date  date,
  phone       text,                 -- nomor WhatsApp, disimpan seperti diketik
  email       text,
  photo_path  text,                 -- path di bucket PRIVAT enkg-people, bukan URL
  address     text,
  area        text,                 -- wilayah singkat, mis. "Kelapa Gading"
  occupation  text,                 -- pekerjaan atau sekolah
  life_group_id   uuid references enkg_life_groups (id) on delete set null,
  life_group_role text not null default 'anggota' check (life_group_role in ('anggota', 'leader')),
  status      text not null default 'aktif'
              check (status in ('baru', 'aktif', 'simpatisan', 'tidak_aktif', 'pindah')),
  joined_on   date,                 -- mulai beribadah di ENKG
  baptized_on date,
  notes       text,                 -- catatan pengurus
  -- Kiriman "Gabung Life Group" yang menjadi asal data ini, kalau ada.
  submission_id uuid references enkg_contact_submissions (id) on delete set null,
  edited_by   text,                 -- "Admin" atau "Leader <nama>": siapa yang terakhir mengubah
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists enkg_people_name_idx on enkg_people (lower(full_name));
create index if not exists enkg_people_life_group_idx on enkg_people (life_group_id);

-- ── Relasi keluarga ──────────────────────────────────────────────────────────
-- Satu baris per pasangan orang. Untuk 'orang_tua', person_id adalah orang tua
-- dan relative_id anaknya. 'pasangan' dan 'saudara' berlaku dua arah.
create table if not exists enkg_relationships (
  id          uuid primary key default gen_random_uuid(),
  person_id   uuid not null references enkg_people (id) on delete cascade,
  relative_id uuid not null references enkg_people (id) on delete cascade,
  kind        text not null check (kind in ('pasangan', 'orang_tua', 'saudara')),
  married_on  date,                 -- hanya untuk 'pasangan': tanggal menikah (pengingat anniversary)
  created_at  timestamptz not null default now(),
  check (person_id <> relative_id)
);
-- Dua orang hanya punya satu relasi, ke arah mana pun dicatatnya.
create unique index if not exists enkg_relationships_pair_idx
  on enkg_relationships (least(person_id, relative_id), greatest(person_id, relative_id));
create index if not exists enkg_relationships_relative_idx on enkg_relationships (relative_id);

-- Kolom yang ditambahkan setelah versi pertama file ini; aman untuk database
-- yang sudah pernah menjalankan versi lama.
alter table enkg_life_groups alter column show_on_calendar set default true;
alter table enkg_people add column if not exists edited_by text;
alter table enkg_relationships add column if not exists married_on date;

-- ── Tim pelayanan & anggotanya ───────────────────────────────────────────────
create table if not exists enkg_teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists enkg_team_members (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references enkg_teams (id) on delete cascade,
  person_id  uuid not null references enkg_people (id) on delete cascade,
  role       text,                  -- mis. "Keyboard", "Gitar", "Pintu depan"
  is_lead    boolean not null default false,
  created_at timestamptz not null default now(),
  unique (team_id, person_id)
);
create index if not exists enkg_team_members_person_idx on enkg_team_members (person_id);

-- Tim awal, hanya saat tabel masih kosong: tim yang sudah dihapus pengurus
-- tidak muncul lagi waktu file ini dijalankan ulang.
insert into enkg_teams (name, description, sort_order)
select name, description, sort_order
from (values
  ('Worship Leader', 'Memimpin pujian dan penyembahan', 10),
  ('Singer',         'Penyanyi tim pujian', 20),
  ('Musisi',         'Keyboard, gitar, bass, dan drum', 30),
  ('Usher',          'Menyambut jemaat dan mengatur tempat duduk', 40),
  ('Multimedia',     'Slide, live streaming, dan dokumentasi', 50),
  ('Sound',          'Operator sound system', 60),
  ('Kids Church',    'Guru dan pendamping ibadah anak', 70),
  ('Doa',            'Tim doa dan pendoa syafaat', 80)
) as seed (name, description, sort_order)
where not exists (select 1 from enkg_teams);

alter table enkg_life_groups   enable row level security;
alter table enkg_people        enable row level security;
alter table enkg_relationships enable row level security;
alter table enkg_teams         enable row level security;
alter table enkg_team_members  enable row level security;

drop trigger if exists enkg_people_touch on enkg_people;
create trigger enkg_people_touch before update on enkg_people
  for each row execute function enkg_touch_updated_at();

drop trigger if exists enkg_life_groups_touch on enkg_life_groups;
create trigger enkg_life_groups_touch before update on enkg_life_groups
  for each row execute function enkg_touch_updated_at();

drop trigger if exists enkg_teams_touch on enkg_teams;
create trigger enkg_teams_touch before update on enkg_teams
  for each row execute function enkg_touch_updated_at();

-- ── Akun login (email + password) ────────────────────────────────────────────
-- Satu akun per orang, didaftarkan admin di panel. Aksesnya mengikuti peran:
--  - is_admin = true          → admin panel;
--  - orangnya leader sebuah LG → portal Life Group (dicek ulang tiap request
--    dari enkg_people.life_group_role, bukan disimpan di sini);
--  - keduanya                 → dua-duanya, tanpa login ulang.
-- Admin pertama dibuat sekali dari halaman masuk dengan kode ADMIN_PASSWORD.
create table if not exists enkg_accounts (
  id                   uuid primary key default gen_random_uuid(),
  email                text not null,
  name                 text not null,
  person_id            uuid unique references enkg_people (id) on delete set null,
  is_admin             boolean not null default false,
  password_hash        text not null,         -- scrypt, lihat src/lib/password.ts
  is_active            boolean not null default true,
  must_change_password boolean not null default true,
  last_login_at        timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Naik dari versi pertama (masuk pakai nomor WA, khusus leader). Akun lama
-- tanpa email tidak bisa dipakai lagi; admin cukup membuatnya ulang.
alter table enkg_accounts add column if not exists email text;
alter table enkg_accounts add column if not exists name text;
alter table enkg_accounts add column if not exists is_admin boolean not null default false;
alter table enkg_accounts alter column person_id drop not null;
delete from enkg_accounts where email is null;
update enkg_accounts set name = email where name is null;
alter table enkg_accounts alter column email set not null;
alter table enkg_accounts alter column name set not null;
alter table enkg_accounts drop column if exists login;
alter table enkg_accounts drop column if exists role;
create unique index if not exists enkg_accounts_email_idx on enkg_accounts (lower(email));
do $$
begin
  -- Data jemaat dihapus → akunnya tetap ada (mis. admin), hanya lepas tautan.
  if exists (
    select 1 from pg_constraint
    where conname = 'enkg_accounts_person_id_fkey' and confdeltype <> 'n'
  ) then
    alter table enkg_accounts drop constraint enkg_accounts_person_id_fkey;
    alter table enkg_accounts
      add constraint enkg_accounts_person_id_fkey foreign key (person_id) references enkg_people (id) on delete set null;
  end if;
end $$;

-- ── Materi Life Group: tulisan dan/atau booklet (PDF) ────────────────────────
create table if not exists enkg_lg_materials (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  summary      text,
  body         text,                -- format rich text sama seperti News
  file_path    text,                -- path di bucket PRIVAT enkg-materials
  file_name    text,
  file_size    int,
  segment      text check (segment in ('family', 'young_professional', 'youth')), -- kosong = semua
  published    boolean not null default false,
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists enkg_lg_materials_published_idx on enkg_lg_materials (published, published_at desc);

-- ── Pertemuan Life Group + laporannya ────────────────────────────────────────
-- Leader menjadwalkan pertemuan (bisa tampil di kalender), lalu mengisi
-- laporannya setelah pertemuan selesai.
create table if not exists enkg_lg_meetings (
  id              uuid primary key default gen_random_uuid(),
  life_group_id   uuid not null references enkg_life_groups (id) on delete cascade,
  starts_at       timestamptz not null,
  place           text,             -- INTERNAL
  topic           text,
  material_id     uuid references enkg_lg_materials (id) on delete set null,
  reported_at     timestamptz,      -- kosong = laporan belum diisi
  attendee_ids    uuid[] not null default '{}',
  guest_count     int not null default 0 check (guest_count >= 0),
  report          text,
  prayer_requests text,
  created_by      uuid references enkg_accounts (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists enkg_lg_meetings_group_idx on enkg_lg_meetings (life_group_id, starts_at desc);

alter table enkg_accounts     enable row level security;
alter table enkg_lg_materials enable row level security;
alter table enkg_lg_meetings  enable row level security;

drop trigger if exists enkg_accounts_touch on enkg_accounts;
create trigger enkg_accounts_touch before update on enkg_accounts
  for each row execute function enkg_touch_updated_at();

drop trigger if exists enkg_lg_materials_touch on enkg_lg_materials;
create trigger enkg_lg_materials_touch before update on enkg_lg_materials
  for each row execute function enkg_touch_updated_at();

drop trigger if exists enkg_lg_meetings_touch on enkg_lg_meetings;
create trigger enkg_lg_meetings_touch before update on enkg_lg_meetings
  for each row execute function enkg_touch_updated_at();

-- Booklet diunggah langsung dari browser lewat signed upload URL, jadi batas
-- ukuran & jenis file dipasang di bucket-nya (sama dengan src/lib/materials.ts).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('enkg-materials', 'enkg-materials', false, 26214400, array['application/pdf'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- ── Foto jemaat: bucket PRIVAT ───────────────────────────────────────────────
-- Berbeda dengan enkg-media, foto hanya bisa dibuka lewat signed URL berumur
-- pendek yang dibuat admin panel.
insert into storage.buckets (id, name, public)
values ('enkg-people', 'enkg-people', false)
on conflict (id) do nothing;

-- ═══════════════════════════════════════════════════════════════════════════
--  Kalender gereja (PUBLIK): jadwal rutin yang diatur admin
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists enkg_schedule (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique,           -- kunci tetap untuk jadwal yang dirujuk kode, mis. 'sunday-service'
  title      text not null,
  category   text not null default 'ibadah' check (category in ('ibadah', 'doa', 'life_group', 'lainnya')),
  recurrence text not null default 'weekly' check (recurrence in ('weekly', 'monthly_nth', 'once')),
  weekday    smallint check (weekday between 0 and 6),   -- 0 = Minggu
  nth        smallint check (nth between 1 and 5),       -- monthly_nth: minggu ke-
  on_date    date,                                        -- once
  start_time time not null,
  end_time   time,
  place      text,
  mode       text not null default 'onsite' check (mode in ('onsite', 'online')),
  link_url   text,
  note       text,
  published  boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enkg_schedule_recurrence_ck check (
    (recurrence = 'weekly' and weekday is not null)
    or (recurrence = 'monthly_nth' and weekday is not null and nth is not null)
    or (recurrence = 'once' and on_date is not null)
  )
);

alter table enkg_schedule enable row level security;
drop policy if exists "enkg public read published schedule" on enkg_schedule;
create policy "enkg public read published schedule" on enkg_schedule for select using (published);

drop trigger if exists enkg_schedule_touch on enkg_schedule;
create trigger enkg_schedule_touch before update on enkg_schedule
  for each row execute function enkg_touch_updated_at();

-- Jadwal awal = jadwal bawaan situs (src/content/schedule.ts), hanya saat tabel
-- masih kosong: jadwal yang sudah dihapus pengurus tidak muncul lagi waktu file
-- ini dijalankan ulang. Slug dipakai kode (Hero, Pelayanan, News), jangan diubah.
insert into enkg_schedule (slug, title, category, recurrence, weekday, nth, start_time, end_time, place, mode, link_url, note, sort_order)
select slug, title, category, recurrence, weekday, nth, start_time::time, end_time::time, place, mode, link_url, note, sort_order
from (values
  ('sunday-prayer',    'Doa Sebelum Ibadah',    'doa',    'weekly',      0, null, '09:15', null,    'Stream Hall',    'onsite', null, null, 10),
  ('sunday-service',   'Ibadah Minggu',         'ibadah', 'weekly',      0, null, '10:00', null,    'Stream Hall',    'onsite', null, null, 20),
  ('kids-church',      'Kids Church',           'ibadah', 'weekly',      0, null, '10:30', null,    'Lt. 2 Unit B6',  'onsite', null, null, 30),
  ('heritage',         'Heritage',              'ibadah', 'weekly',      0, null, '10:30', null,    'Lt. 2 Room B5',  'onsite', null, null, 40),
  ('wednesday-prayer', 'Weekly Prayer Meeting', 'doa',    'weekly',      3, null, '20:00', null,    'Zoom',           'online',
     'https://us02web.zoom.us/j/85432760648?pwd=ODhYcTZmeE9zTGE0M1pEUWIvaXZodz09',
     'Meeting ID 854 3276 0648 · Passcode: prayer', 50),
  ('friday-prayer',    'Onsite Prayer Meeting', 'doa',    'monthly_nth', 5, 4,    '18:00', '20:00', 'Stream Hall',    'onsite', null, null, 60)
) as seed (slug, title, category, recurrence, weekday, nth, start_time, end_time, place, mode, link_url, note, sort_order)
where not exists (select 1 from enkg_schedule);

-- ═══════════════════════════════════════════════════════════════════════════
--  Bot Telegram internal (INTERNAL)
--
--  Penerima = satu orang internal, dikenali dari nomor Telegram-nya. Admin
--  mendaftarkan nama + nomor; orangnya membuka bot di chat pribadi dan menekan
--  "Kirim nomor saya". Kalau nomornya cocok, chat_id dan telegram_user_id
--  terisi dan pesan mulai dikirim satu per satu ke orang itu. Grup tidak bisa
--  ditautkan. RLS menyala tanpa policy: hanya service role.
-- ═══════════════════════════════════════════════════════════════════════════
create table if not exists enkg_telegram_chats (
  id               uuid primary key default gen_random_uuid(),
  name             text,
  phone            text,                 -- seperti diketik admin
  phone_digits     text not null,        -- "0812..." hasil phoneDigits, untuk dicocokkan (unik, lihat indeks)
  chat_id          bigint unique,        -- kosong = belum membuka bot
  telegram_user_id bigint,              -- unik, lihat indeks
  linked_at        timestamptz,
  title            text,
  chat_type        text,                 -- selalu 'private' untuk penerima yang tersambung
  -- Pengingat yang dikirim ke orang ini.
  topics           text[] not null default array['ulang_tahun', 'anniversary', 'jadwal', 'jemaat_baru', 'doa']::text[],
  is_active        boolean not null default true,
  last_digest_on   date,                 -- tanggal (WIB) ringkasan harian terakhir terkirim
  linked_by        text,                 -- nama akun Telegram saat tersambung
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint enkg_telegram_topics_ck
    check (topics <@ array['ulang_tahun', 'anniversary', 'jadwal', 'jemaat_baru', 'doa']::text[])
);

-- Naik dari versi sebelumnya (chat grup + kode tautan). Aman dijalankan ulang.
alter table enkg_telegram_chats add column if not exists name text;
alter table enkg_telegram_chats add column if not exists phone text;
alter table enkg_telegram_chats add column if not exists phone_digits text;
alter table enkg_telegram_chats add column if not exists telegram_user_id bigint;
alter table enkg_telegram_chats add column if not exists linked_at timestamptz;
alter table enkg_telegram_chats alter column chat_id drop not null;
-- Chat lama tanpa nomor (grup atau hasil kode tautan) tidak berlaku lagi.
delete from enkg_telegram_chats where phone_digits is null;
alter table enkg_telegram_chats alter column phone_digits set not null;
create unique index if not exists enkg_telegram_phone_idx on enkg_telegram_chats (phone_digits);
create unique index if not exists enkg_telegram_user_idx on enkg_telegram_chats (telegram_user_id);
alter table enkg_telegram_chats drop constraint if exists enkg_telegram_topics_ck;
alter table enkg_telegram_chats add constraint enkg_telegram_topics_ck
  check (topics <@ array['ulang_tahun', 'anniversary', 'jadwal', 'jemaat_baru', 'doa']::text[]);
alter table enkg_telegram_chats alter column topics
  set default array['ulang_tahun', 'anniversary', 'jadwal', 'jemaat_baru', 'doa']::text[];
drop table if exists enkg_telegram_link_codes;

alter table enkg_telegram_chats enable row level security;

drop trigger if exists enkg_telegram_chats_touch on enkg_telegram_chats;
create trigger enkg_telegram_chats_touch before update on enkg_telegram_chats
  for each row execute function enkg_touch_updated_at();
