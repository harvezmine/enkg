import { beforeAll, describe, expect, it } from "vitest";

import { consumeProposal, signProposal, verifyProposal } from "./proposals";

const ADMIN = "3f1c2b4a-5d6e-4f70-8a91-b2c3d4e5f607";
const proposal = { kind: "submission_status" as const, summary: "Ubah status", data: { id: "s1", status: "dihubungi" } };

beforeAll(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = "kunci-server-untuk-tes";
});

describe("usulan aksi asisten", () => {
  it("usulan sah untuk akun yang membuatnya", () => {
    const token = signProposal(proposal, ADMIN);
    expect(verifyProposal(token, ADMIN)).toMatchObject({ kind: "submission_status", data: { status: "dihubungi" } });
  });

  it("ditolak untuk akun lain", () => {
    expect(verifyProposal(signProposal(proposal, ADMIN), "00000000-0000-4000-8000-000000000000")).toBeNull();
  });

  it("ditolak kalau isinya diubah", () => {
    const [body, sig] = signProposal(proposal, ADMIN).split(".");
    const tampered = JSON.parse(Buffer.from(body!, "base64url").toString());
    tampered.data.status = "selesai";
    const forged = `${Buffer.from(JSON.stringify(tampered)).toString("base64url")}.${sig}`;
    expect(verifyProposal(forged, ADMIN)).toBeNull();
  });

  it("ditolak setelah kedaluwarsa", () => {
    const token = signProposal(proposal, ADMIN, Date.now() - 16 * 60 * 1000);
    expect(verifyProposal(token, ADMIN)).toBeNull();
  });

  it("hanya bisa dijalankan sekali", () => {
    const token = signProposal(proposal, ADMIN);
    const payload = verifyProposal(token, ADMIN)!;
    consumeProposal(payload);
    expect(verifyProposal(token, ADMIN)).toBeNull();
  });

  it("ditolak dengan kunci server lain", () => {
    const token = signProposal(proposal, ADMIN);
    process.env.SUPABASE_SERVICE_ROLE_KEY = "kunci-lain";
    expect(verifyProposal(token, ADMIN)).toBeNull();
    process.env.SUPABASE_SERVICE_ROLE_KEY = "kunci-server-untuk-tes";
  });
});
