import { NextResponse } from "next/server";

import { sendDailyDigests } from "@/lib/telegram/digest";
import { bearerMatches } from "@/lib/telegram/secret";

export const dynamic = "force-dynamic";

/**
 * Ringkasan harian, dipanggil cron PM2 (scripts/telegram-daily.mjs) tiap jam.
 * Pengiriman pertama setelah 06.00 WIB yang jalan; sisanya dilewati karena
 * setiap chat hanya menerima satu ringkasan per hari.
 */
export async function POST(request: Request) {
  if (!bearerMatches(request.headers.get("authorization"), process.env.CRON_SECRET?.trim())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const report = await sendDailyDigests();
  return NextResponse.json({ ok: true, ...report });
}
