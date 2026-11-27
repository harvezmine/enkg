import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/*
 * Usulan aksi dari asisten (buat draf, masukkan ke LG, ubah status, ...).
 * Asisten TIDAK pernah menjalankan aksi tulis sendiri: ia hanya membuat
 * usulan bertanda tangan HMAC. Aksi baru jalan setelah admin menekan
 * "Jalankan", dan server memeriksa ulang tanda tangan, pemilik akun,
 * kedaluwarsa, dan bahwa usulan belum pernah dipakai.
 */

export type ProposalKind = "news_draft" | "event" | "assign_lg" | "submission_status";

export type Proposal = {
  kind: ProposalKind;
  /** Kalimat satu baris untuk kartu konfirmasi. */
  summary: string;
  data: Record<string, unknown>;
};

type Signed = Proposal & { account: string; exp: number; nonce: string };

const TTL_MS = 15 * 60 * 1000;

function key() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Kunci server belum diatur");
  return `enkg-assistant-proposal-v1|${secret}`;
}

const sign = (body: string) => createHmac("sha256", key()).update(body).digest("base64url");

export function signProposal(proposal: Proposal, accountId: string, now = Date.now()) {
  const payload: Signed = { ...proposal, account: accountId, exp: now + TTL_MS, nonce: randomBytes(12).toString("base64url") };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Nonce yang sudah dipakai (per proses). Cukup untuk mencegah tombol ditekan dua kali. */
const used = new Map<string, number>();

export function verifyProposal(token: string, accountId: string, now = Date.now()): Signed | null {
  if (typeof token !== "string" || token.length > 20000) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  let payload: Signed;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (payload.account !== accountId || payload.exp < now) return null;
  for (const [nonce, exp] of used) if (exp < now) used.delete(nonce);
  if (used.has(payload.nonce)) return null;
  return payload;
}

/** Tandai usulan sudah dijalankan, supaya tidak bisa diulang. */
export function consumeProposal(payload: Signed) {
  used.set(payload.nonce, payload.exp);
}
