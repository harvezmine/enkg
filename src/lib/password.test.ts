import { describe, expect, it } from "vitest";

import { generateTempPassword, hashPassword, passwordFingerprint, verifyPassword } from "./password";

describe("password leader", () => {
  it("hash bisa diverifikasi dan menolak password lain", async () => {
    const hash = await hashPassword("kasih-setia-2026");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("kasih-setia-2026", hash)).toBe(true);
    expect(await verifyPassword("kasih-setia-2027", hash)).toBe(false);
  });

  it("salt acak: password sama menghasilkan hash berbeda", async () => {
    const [a, b] = await Promise.all([hashPassword("sama-saja-123"), hashPassword("sama-saja-123")]);
    expect(a).not.toBe(b);
    expect(passwordFingerprint(a)).not.toBe(passwordFingerprint(b));
  });

  it("menolak hash yang rusak tanpa melempar error", async () => {
    expect(await verifyPassword("apa saja", "")).toBe(false);
    expect(await verifyPassword("apa saja", "scrypt$abc$8$1$xx$yy")).toBe(false);
    expect(await verifyPassword("apa saja", "bcrypt$10$8$1$xx$yy")).toBe(false);
  });

  it("password sementara mudah dibaca dan tidak berulang", () => {
    const a = generateTempPassword();
    expect(a).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);
    expect(a).not.toMatch(/[01ilo]/);
    expect(generateTempPassword()).not.toBe(a);
  });
});
