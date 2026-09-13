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
