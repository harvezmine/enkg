import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DESTINATIONS, DOWNLOAD_PATHS, ENTITY_LINKS, GUIDE_ANCHORS, isDownloadHref, isKnownAdminHref, sitemapForPrompt } from "./sitemap";

const APP = join(process.cwd(), "src/app");

/** /admin/jemaat/{id}/ubah → ada page.tsx atau route.ts di src/app/admin[/(panel)]/jemaat/[id]/ubah. */
function routeExists(href: string) {
  const path = href.split(/[?#]/)[0]!.replace(/\{id\}/g, "[id]");
  const rest = path.replace(/^\/admin/, "");
  return [join(APP, "admin", rest), join(APP, "admin", "(panel)", rest)].some(
    (dir) => existsSync(join(dir, "page.tsx")) || existsSync(join(dir, "route.ts")),
  );
}

describe("peta halaman asisten", () => {
  it("semua alamat menuju rute yang ada", () => {
    const hrefs = [...DESTINATIONS.map((d) => d.href), ...ENTITY_LINKS.map((e) => e.href), ...DOWNLOAD_PATHS];
    expect(hrefs.filter((href) => !routeExists(href))).toEqual([]);
  });

  it("anchor panduan ada di halaman panduan", () => {
    const guide = readFileSync(join(APP, "admin/(panel)/panduan/page.tsx"), "utf8");
    expect(GUIDE_ANCHORS.filter((id) => !guide.includes(`id: "${id}"`))).toEqual([]);
  });

  it("menerima alamat yang ada, dengan query dan anchor", () => {
    for (const href of [
      "/admin",
      "/admin/jemaat/baru",
      "/admin/jemaat?q=Felix",
      "/admin/life-group?baru=1",
      "/admin/jemaat/2f6c1a0e-9c1b-4a5e-8f2d-1b2c3d4e5f60",
      "/admin/jemaat/2f6c1a0e-9c1b-4a5e-8f2d-1b2c3d4e5f60/ubah",
      "/admin/jemaat/2f6c1a0e-9c1b-4a5e-8f2d-1b2c3d4e5f60#akun-portal",
      "/admin/life-group/0b5d7a1e-3f4a-4c2b-9e8d-7a6b5c4d3e2f/laporan",
      "/admin/panduan#keluarga",
    ]) {
      expect(isKnownAdminHref(href), href).toBe(true);
    }
  });

  it("menolak alamat karangan, placeholder, dan luar admin", () => {
    for (const href of [
      "/admin/jemaat/tambah",
      "/admin/jemaat/{id}",
      "/admin/life-group/abc-123",
      "/admin/life-group/x/y/z",
      "/admin//evil.example",
      "/administrator",
      "/portal",
      "https://contoh.com/admin",
      "javascript:alert(1)",
    ]) {
      expect(isKnownAdminHref(href), href).toBe(false);
    }
  });

  it("mengenali rute unduhan", () => {
    expect(isDownloadHref("/admin/jemaat-excel/ekspor")).toBe(true);
    expect(isDownloadHref("/admin/jemaat")).toBe(false);
  });

  it("peta masuk ke prompt", () => {
    const text = sitemapForPrompt();
    expect(text).toContain("/admin/jemaat/baru");
    expect(text).toContain("/admin/life-group/{id}");
  });
});
