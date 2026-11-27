import { NextResponse } from "next/server";

import { isAdminSession } from "@/lib/admin-auth";
import { isAssistantConfigured, runAgent, type AgentEvent, type ChatTurn } from "@/lib/assistant/agent";
import { getSession } from "@/lib/auth";

/*
 * Asisten internal admin. GET: apakah aktif. POST: satu giliran percakapan,
 * dijawab sebagai NDJSON (status → usulan → jawaban) supaya UI bisa
 * menampilkan "Mencari jemaat…" selama alat berjalan.
 *
 * Hanya admin. Isi pesan tidak pernah dicatat ke log.
 */

const MAX_TURNS = 12;
const MAX_CHARS = 1500;
const LIMIT = 30;
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimited(accountId: string, now: number) {
  const recent = (hits.get(accountId) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= LIMIT) return true;
  hits.set(accountId, [...recent, now]);
  return false;
}

export async function GET() {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Sesi berakhir." }, { status: 401 });
  return NextResponse.json({ enabled: isAssistantConfigured() });
}

export async function POST(request: Request) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Sesi berakhir." }, { status: 401 });
  if (!isAssistantConfigured()) return NextResponse.json({ error: "Asisten belum aktif." }, { status: 503 });
  const session = (await getSession())!;
  if (rateLimited(session.account.id, Date.now())) {
    return NextResponse.json({ error: "Terlalu banyak pesan. Tunggu beberapa menit." }, { status: 429 });
  }

  let history: ChatTurn[];
  try {
    const body = (await request.json()) as { messages?: unknown };
    if (!Array.isArray(body.messages)) throw new Error();
    history = body.messages
      .slice(-MAX_TURNS)
      .filter(
        (m): m is ChatTurn =>
          !!m && typeof m === "object" && ((m as ChatTurn).role === "user" || (m as ChatTurn).role === "assistant") && typeof (m as ChatTurn).content === "string",
      )
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
    if (!history.length || history.at(-1)!.role !== "user" || !history.at(-1)!.content.trim()) throw new Error();
  } catch {
    return NextResponse.json({ error: "Pesan tidak valid." }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: AgentEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      await runAgent({ db: session.supabase, accountId: session.account.id, history, emit, signal: request.signal });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
