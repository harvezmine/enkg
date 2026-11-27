import { beforeAll, describe, expect, it } from "vitest";

import { checkSetupCode, createSessionToken, verifySessionToken } from "./session";

const ACCOUNT = "3f1c2b4a-5d6e-4f70-8a91-b2c3d4e5f607";
const FP = "a1b2c3d4e5f60718293a4b5c";

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key-untuk-tes";
  process.env.ADMIN_PASSWORD = "kode-pengaturan-untuk-tes";
});

describe("sesi login", () => {
  it("token baru sah dan membawa akun & sidik jari password", async () => {
    const token = await createSessionToken(ACCOUNT, FP);
    expect(await verifySessionToken(token)).toMatchObject({ accountId: ACCOUNT, fingerprint: FP });
  });

  it("menolak token yang diubah sedikit pun", async () => {
    const token = await createSessionToken(ACCOUNT, FP);
    const [, fp, exp, sig] = token.split(".");
    expect(await verifySessionToken(`00000000-0000-4000-8000-000000000000.${fp}.${exp}.${sig}`)).toBeNull();
    expect(await verifySessionToken(`${ACCOUNT}.${"f".repeat(24)}.${exp}.${sig}`)).toBeNull();
    expect(await verifySessionToken(`${ACCOUNT}.${fp}.${Number(exp) + 999}.${sig}`)).toBeNull();
    expect(await verifySessionToken(`${token}x`)).toBeNull();
    expect(await verifySessionToken(undefined)).toBeNull();
  });

  it("menolak token kedaluwarsa", async () => {
    const token = await createSessionToken(ACCOUNT, FP, Date.now() - 15 * 24 * 3600 * 1000);
    expect(await verifySessionToken(token)).toBeNull();
  });

  it("token tidak sah dengan kunci server lain", async () => {
    const token = await createSessionToken(ACCOUNT, FP);
    process.env.SUPABASE_SERVICE_ROLE_KEY = "kunci-lain";
    expect(await verifySessionToken(token)).toBeNull();
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key-untuk-tes";
  });
});

describe("kode pengaturan admin pertama", () => {
  it("cocok hanya dengan ADMIN_PASSWORD", async () => {
    expect(await checkSetupCode("kode-pengaturan-untuk-tes")).toBe(true);
    expect(await checkSetupCode("kode-pengaturan-untuk-te")).toBe(false);
    expect(await checkSetupCode("")).toBe(false);
  });

  it("mati kalau ADMIN_PASSWORD kosong atau terlalu pendek", async () => {
    process.env.ADMIN_PASSWORD = "pendek";
    expect(await checkSetupCode("pendek")).toBe(false);
    process.env.ADMIN_PASSWORD = "kode-pengaturan-untuk-tes";
  });
});
