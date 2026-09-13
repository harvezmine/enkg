import { describe, expect, it } from "vitest";

import type { ChurchEvent, Post } from "./db-types";
import { eventToNewsItem, eventToProcon, postToNewsItem, summarize } from "./queries";

const post: Post = {
  id: "p1",
  slug: "baptisan-air-oktober",
  title: "Baptisan Air Oktober",
  excerpt: null,
  body: "## Pendaftaran\n\nDaftarkan dirimu **paling lambat** 10 Oktober lewat Life Group.\n\n- Bawa baju ganti",
  cover_url: "https://example.supabase.co/storage/v1/object/public/enkg-media/2026/a.jpg",
  category: "kabar",
  author: "Tim ENKG",
  published: true,
  published_at: "2026-09-20T01:00:00.000Z",
  created_at: "2026-09-19T01:00:00.000Z",
  updated_at: "2026-09-20T01:00:00.000Z",
};

const event: ChurchEvent = {
  id: "e1",
  slug: "kelola-uang",
  title: "Mengelola Uang dengan Bijak",
  description: null,
  category: "procon",
  topic: "Keuangan",
  partner: "Bersama blu by BCA Digital",
  starts_at: null,
  ends_at: null,
  location: null,
  address: null,
  map_url: null,
  cover_url: null,
  register_url: "https://forms.gle/contoh",
  published: true,
  created_at: "2026-09-19T01:00:00.000Z",
  updated_at: "2026-09-19T01:00:00.000Z",
};

describe("summarize", () => {
  it("mengambil paragraf pertama tanpa sub-judul dan sintaks tebal", () => {
    expect(summarize(post.body)).toBe("Daftarkan dirimu paling lambat 10 Oktober lewat Life Group.");
  });

  it("memotong teks panjang dengan elipsis", () => {
    expect(summarize("a".repeat(300), 20)).toBe(`${"a".repeat(19)}…`);
    expect(summarize(null)).toBe("");
  });
});

describe("pemetaan ke kartu situs", () => {
  it("tulisan tanpa ringkasan memakai paragraf pertama isi", () => {
    expect(postToNewsItem(post)).toMatchObject({
      type: "kabar",
      date: "2026-09-20",
      summary: "Daftarkan dirimu paling lambat 10 Oktober lewat Life Group.",
      href: "/news/baptisan-air-oktober",
      image: { src: post.cover_url, alt: post.title },
    });
  });

  it("event gereja memakai tanggal mulai dalam WIB", () => {
    const item = eventToNewsItem({ ...event, category: "gereja", starts_at: "2026-10-09T18:00:00.000Z" });
    // 18.00 UTC = 01.00 WIB tanggal 10
    expect(item).toMatchObject({ type: "event", date: "2026-10-10", href: "/event/kelola-uang" });
  });

  it("ProCon tanpa tanggal tampil sebagai 'Segera hadir' dan tautan ke pendaftaran", () => {
    expect(eventToProcon(event)).toEqual({
      id: "e1",
      title: "Mengelola Uang dengan Bijak",
      topic: "Keuangan",
      summary: "",
      date: null,
      partner: "Bersama blu by BCA Digital",
      href: "https://forms.gle/contoh",
    });
  });

  it("ProCon dengan deskripsi menautkan ke halaman detail event", () => {
    expect(eventToProcon({ ...event, description: "Kelas 2 jam." }).href).toBe("/event/kelola-uang");
  });
});
