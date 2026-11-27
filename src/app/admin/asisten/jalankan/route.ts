import { NextResponse } from "next/server";

import { isAdminSession } from "@/lib/admin-auth";
import { executeProposal } from "@/lib/assistant/execute";
import { consumeProposal, verifyProposal } from "@/lib/assistant/proposals";
import { getSession } from "@/lib/auth";

/**
 * Jalankan usulan asisten setelah admin menekan "Jalankan". Tanda tangan,
 * pemilik akun, kedaluwarsa, dan sekali-pakai diperiksa; isiannya divalidasi
 * ulang saat dijalankan.
 */
export async function POST(request: Request) {
  if (!(await isAdminSession())) return NextResponse.json({ ok: false, message: "Sesi berakhir." }, { status: 401 });
  const session = (await getSession())!;

  let token = "";
  try {
    token = String(((await request.json()) as { token?: unknown }).token ?? "");
  } catch {
    // diperiksa di bawah
  }
  const proposal = verifyProposal(token, session.account.id);
  if (!proposal) {
    return NextResponse.json({ ok: false, message: "Usulan sudah kedaluwarsa atau sudah dijalankan. Minta ulang ke asisten." }, { status: 400 });
  }
  consumeProposal(proposal);

  const result = await executeProposal(session.supabase, proposal.kind, proposal.data);
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
