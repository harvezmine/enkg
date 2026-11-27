import { NextResponse } from "next/server";

import { isAdminSession } from "@/lib/admin-auth";
import { todayWib } from "@/lib/people";
import { loadDirectory } from "@/lib/people-data";
import { attachment, buildExport } from "@/lib/people-excel";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Seluruh data jemaat sebagai Excel, dengan kolom yang sama seperti template
 * impor (plus ID), jadi file ini bisa diubah lalu diimpor balik.
 */
export async function GET() {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Sesi berakhir." }, { status: 401 });
  const dir = await loadDirectory(createAdminClient());
  if (dir.error) return NextResponse.json({ error: "Belum bisa membaca database." }, { status: 503 });
  const file = await buildExport(dir);
  return new NextResponse(new Uint8Array(file), { headers: attachment(`data-jemaat-enkg-${todayWib()}.xlsx`) });
}
