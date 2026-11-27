import { buildSystemPrompt } from "@/lib/chatbot/knowledge";
import { getChatKnowledge } from "@/lib/chatbot/context";
import { CRISIS_REPLY, fallbackReply, isCrisis, parseConversation } from "@/lib/chatbot/messages";
import { createSseTextParser } from "@/lib/chatbot/sse";

/*
 * Chatbot situs publik. Jawaban dari DeepSeek (API kompatibel OpenAI),
 * dialirkan ke browser sebagai teks biasa. Tanpa DEEPSEEK_API_KEY, atau saat
 * layanan AI gagal, jawaban diambil dari pencocokan kata kunci ke informasi
 * publik yang sama, jadi chatbot tidak pernah "mati".
 *
 * Isi pesan pengunjung TIDAK pernah ditulis ke log.
 */

export const dynamic = "force-dynamic";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";
const UPSTREAM_TIMEOUT_MS = 30_000;
const MAX_BODY = 16_000;

/* Batas per IP, di memori proses (tiap worker PM2 menghitung sendiri). */
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 20;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string, now: number) {
  if (hits.size > 5000) for (const [key, value] of hits) if (value.resetAt <= now) hits.delete(key);
  const entry = hits.get(ip);
  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > LIMIT;
}

/** nginx menimpa X-Real-IP dengan IP asli; X-Forwarded-For dipakai entri terakhirnya (sama seperti login admin). */
const clientIp = (request: Request) =>
  request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "local";

/** Hanya halaman situs ini sendiri yang boleh memanggil (Origin harus sama dengan host yang dibuka). */
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

const text = (body: string, status = 200, mode = "faq") =>
  new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Chat-Mode": mode },
  });

export async function POST(request: Request) {
  if (!sameOrigin(request)) return text("Permintaan ditolak.", 403);
  if (!request.headers.get("content-type")?.includes("application/json")) return text("Format tidak didukung.", 415);
  if (rateLimited(clientIp(request), Date.now())) {
    return text("Kamu mengirim banyak pesan dalam waktu singkat. Tunggu beberapa menit, atau lanjut lewat WhatsApp ya.", 429);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY) return text("Pesan terlalu panjang.", 413);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return text("Format pesan tidak dikenal.", 400);
  }
  const conversation = parseConversation(body);
  if (!conversation.ok) return text(conversation.error, 400);

  const question = conversation.messages.at(-1)!.content;
  // Tanda krisis selalu dijawab dengan teks tetap yang sudah diperiksa.
  if (isCrisis(question)) return text(CRISIS_REPLY, 200, "safety");

  const knowledge = await getChatKnowledge();
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) return text(fallbackReply(question, knowledge));

  const timeout = AbortSignal.timeout(UPSTREAM_TIMEOUT_MS);
  let upstream: Response;
  try {
    upstream = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        temperature: 0.3,
        max_tokens: 500,
        messages: [{ role: "system", content: buildSystemPrompt(knowledge) }, ...conversation.messages],
      }),
      signal: AbortSignal.any([timeout, request.signal]),
    });
  } catch (error) {
    console.error("[chat] DeepSeek tidak terjangkau:", (error as Error).name);
    return text(fallbackReply(question, knowledge));
  }
  if (!upstream.ok || !upstream.body) {
    console.error("[chat] DeepSeek menolak:", upstream.status);
    return text(fallbackReply(question, knowledge));
  }

  // SSE DeepSeek ("data: {...}") → potongan teks jawaban saja.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reader = upstream.body.getReader();
  const parse = createSseTextParser();
  let sent = false;

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (!sent) controller.enqueue(encoder.encode(fallbackReply(question, knowledge)));
            controller.close();
            return;
          }
          const chunk = parse(decoder.decode(value, { stream: true }));
          if (chunk) {
            sent = true;
            controller.enqueue(encoder.encode(chunk));
            return;
          }
        }
      } catch (error) {
        console.error("[chat] aliran terputus:", (error as Error).name);
        if (!sent) controller.enqueue(encoder.encode(fallbackReply(question, knowledge)));
        controller.close();
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Chat-Mode": "ai",
      // nginx: jangan tahan aliran sampai selesai.
      "X-Accel-Buffering": "no",
    },
  });
}
