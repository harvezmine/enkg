import { beforeAll, describe, expect, it } from "vitest";

import { createSessionToken, verifySessionToken } from "./admin-session";
import { createLeaderToken, verifyLeaderToken } from "./leader-session";

const ACCOUNT = "3f1c2b4a-5d6e-4f70-8a91-b2c3d4e5f607";
const FP = "a1b2c3d4e5f60718293a4b5c";

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key-untuk-tes";
  process.env.ADMIN_PASSWORD = "password-admin-untuk-tes";
});

describe("sesi leader", () => {
  it("token yang baru dibuat sah dan membawa akun & sidik jari", async () => {
    const token = await createLeaderToken(ACCOUNT, FP);
    expect(await verifyLeaderToken(token)).toMatchObject({ accountId: ACCOUNT, fingerprint: FP });
  });

  it("menolak token yang diubah", async () => {
    const token = await createLeaderToken(ACCOUNT, FP);
    const [, fp, exp, sig] = token.split(".");
    const otherAccount = "00000000-0000-4000-8000-000000000000";
    expect(await verifyLeaderToken(`${otherAccount}.${fp}.${exp}.${sig}`)).toBeNull();
    expect(await verifyLeaderToken(`${ACCOUNT}.${"f".repeat(24)}.${exp}.${sig}`)).toBeNull();
    expect(await verifyLeaderToken(`${ACCOUNT}.${fp}.${Number(exp) + 999}.${sig}`)).toBeNull();
    expect(await verifyLeaderToken(`${token}x`)).toBeNull();
  });

  it("menolak token kedaluwarsa", async () => {
    const issued = Date.now() - 15 * 24 * 60 * 60 * 1000;
    const token = await createLeaderToken(ACCOUNT, FP, issued);
    expect(await verifyLeaderToken(token)).toBeNull();
  });

  it("gugur bila service-role key diganti", async () => {
    const token = await createLeaderToken(ACCOUNT, FP);
    process.env.SUPABASE_SERVICE_ROLE_KEY = "kunci-baru";
    expect(await verifyLeaderToken(token)).toBeNull();
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key-untuk-tes";
  });

  it("token leader tidak pernah sah sebagai sesi admin, dan sebaliknya", async () => {
    const leader = await createLeaderToken(ACCOUNT, FP);
    const admin = await createSessionToken();
    expect(await verifySessionToken(leader)).toBe(false);
    expect(await verifyLeaderToken(admin)).toBeNull();
    // Tanda tangan admin ditempel ke badan token leader juga ditolak.
    const [exp, adminSig] = admin.split(".");
    expect(await verifyLeaderToken(`${ACCOUNT}.${FP}.${exp}.${adminSig}`)).toBeNull();
  });
});
