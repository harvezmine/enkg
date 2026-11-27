import { NextResponse } from "next/server";

import { isAdminSession } from "@/lib/admin-auth";
import { loadDirectory } from "@/lib/people-data";
import { attachment, buildTemplate } from "@/lib/people-excel";
import { createAdminClient } from "@/lib/supabase/admin";

/** Template Excel impor jemaat, lengkap dengan daftar Life Group dan tim yang ada. */
export async function GET() {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Sesi berakhir." }, { status: 401 });
  const dir = await loadDirectory(createAdminClient());
  const file = await buildTemplate(dir);
  return new NextResponse(new Uint8Array(file), { headers: attachment("template-impor-jemaat-enkg.xlsx") });
}
