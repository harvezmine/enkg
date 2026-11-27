import { LIFE_GROUP_SEGMENT_LABEL, type LifeGroup, type LifeGroupSegment, type Person } from "./db-types";
import { ageOn } from "./people";

/** Pilihan untuk PersonPicker: baris kedua berisi panggilan, umur, wilayah, dan Life Group. */
export function pickerOption(person: Person, today: string, groupsById?: Map<string, Pick<LifeGroup, "name">>) {
  const group = person.life_group_id ? groupsById?.get(person.life_group_id)?.name : null;
  return {
    id: person.id,
    name: person.full_name,
    detail: [
      person.nickname,
      person.birth_date ? `${ageOn(person.birth_date, today)} th` : null,
      person.area,
      group,
    ]
      .filter(Boolean)
      .join(" · "),
    keywords: person.phone ?? undefined,
  };
}

/** "Young Professional" dari form Contact Us → kunci kelompok Life Group. */
export function segmentFromLabel(label: string | null | undefined): LifeGroupSegment | null {
  const match = Object.entries(LIFE_GROUP_SEGMENT_LABEL).find(([, value]) => value === label);
  return (match?.[0] as LifeGroupSegment | undefined) ?? null;
}
