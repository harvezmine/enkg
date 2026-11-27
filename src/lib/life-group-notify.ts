import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { TABLES } from "./db-types";
import { whatsappLink } from "./whatsapp";

/**
 * Tautan WhatsApp untuk mengabari leader bahwa ada anggota baru di grupnya.
 * Null kalau orangnya belum punya grup, dia sendiri leader-nya, atau tidak
 * ada leader lain yang punya nomor WA.
 */
export async function leaderNotice(supabase: SupabaseClient, personId: string) {
  const { data: person } = await supabase
    .from(TABLES.people)
    .select("id, full_name, nickname, phone, life_group_id, life_group_role")
    .eq("id", personId)
    .maybeSingle();
  if (!person?.life_group_id) return null;

  const [{ data: group }, { data: leader }] = await Promise.all([
    supabase.from(TABLES.lifeGroups).select("name").eq("id", person.life_group_id).maybeSingle(),
    supabase
      .from(TABLES.people)
      .select("full_name, nickname, phone")
      .eq("life_group_id", person.life_group_id)
      .eq("life_group_role", "leader")
      .neq("id", personId)
      .not("phone", "is", null)
      .order("full_name")
      .limit(1)
      .maybeSingle(),
  ]);
  if (!group) return null;

  const name = person.nickname || person.full_name;
  const message = `${name} masuk ke ${group.name}${person.life_group_role === "leader" ? " sebagai leader" : ""}.`;
  if (!leader?.phone || person.life_group_role === "leader") return { message, notify: undefined };

  const leaderName = leader.nickname || leader.full_name.split(" ")[0];
  const greeting = [
    `Halo ${leaderName}, ada anggota baru untuk ${group.name}: ${person.full_name}`,
    person.phone ? ` (WA ${person.phone})` : "",
    ". Tolong disapa dan diajak ke pertemuan berikutnya ya. Terima kasih!",
  ].join("");

  return { message, notify: { href: whatsappLink(leader.phone, greeting), label: `Kabari ${leaderName} lewat WhatsApp` } };
}
