import { NextResponse } from "next/server";

import { isAdminSession } from "@/lib/admin-auth";
import { TABLES, type Person } from "@/lib/db-types";
import { matchesQuery } from "@/lib/people";
import { selectAll } from "@/lib/people-data";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_RESULTS = 8;

type Row = Pick<Person, "id" | "full_name" | "nickname" | "area" | "phone" | "email" | "life_group_id">;

/**
 * Pencarian cepat di admin panel. Hanya untuk sesi admin, dan yang dikirim
 * balik hanya nama, panggilan, wilayah, dan nama Life Group. Nomor WA dipakai
 * untuk mencocokkan, tapi tidak ikut dikirim ke browser.
 */
export async function GET(request: Request) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Sesi berakhir." }, { status: 401 });

  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ people: [] });

  const supabase = createAdminClient();
  const [people, groups] = await Promise.all([
    selectAll<Row>((from, to) =>
      supabase.from(TABLES.people).select("id, full_name, nickname, area, phone, email, life_group_id").order("id").range(from, to),
    ),
    supabase.from(TABLES.lifeGroups).select("id, name"),
  ]);
  if (people.error) return NextResponse.json({ error: "Belum bisa membaca data." }, { status: 503 });

  const groupName = new Map((groups.data ?? []).map((group) => [group.id as string, group.name as string]));
  const results = people.data
    .filter((person) => matchesQuery(person, q, person.life_group_id ? groupName.get(person.life_group_id) : null))
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "id", { sensitivity: "base" }))
    .slice(0, MAX_RESULTS)
    .map((person) => ({
      id: person.id,
      name: person.full_name,
      detail: [person.nickname, person.area, person.life_group_id ? groupName.get(person.life_group_id) : null]
        .filter(Boolean)
        .join(" · "),
    }));

  return NextResponse.json({ people: results }, { headers: { "Cache-Control": "no-store" } });
}
