import { describe, expect, it } from "vitest";

import { canOptimizeImage, linkTarget } from "./images";

const SUPABASE = "http://127.0.0.1:54321/";

describe("canOptimizeImage", () => {
  it("mengoptimasi file lokal dan Supabase Storage", () => {
    expect(canOptimizeImage("/images/photos/worship.jpg", SUPABASE)).toBe(true);
    expect(canOptimizeImage("http://127.0.0.1:54321/storage/v1/object/public/enkg-media/2026/a.jpg", SUPABASE)).toBe(true);
  });

  it("tidak mengoptimasi host lain atau URL protokol-relatif", () => {
    expect(canOptimizeImage("https://example.com/poster.jpg", SUPABASE)).toBe(false);
    expect(canOptimizeImage("//example.com/poster.jpg", SUPABASE)).toBe(false);
    expect(canOptimizeImage("http://127.0.0.1:54321/storage/v1/object/public/enkg-media/a.jpg", undefined)).toBe(false);
  });
});

describe("linkTarget", () => {
  it("membuka tautan luar di tab baru", () => {
    expect(linkTarget("/news/ibadah-raya")).toEqual({});
    expect(linkTarget("https://wa.me/62812")).toEqual({ target: "_blank", rel: "noopener noreferrer" });
  });
});
