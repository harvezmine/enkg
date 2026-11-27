import "server-only";

import writeXlsxFile from "write-excel-file/node";

import { LIFE_GROUP_ROLE_LABEL, PERSON_STATUS_LABEL } from "./db-types";
import { familyOf, todayWib } from "./people";
import { indexDirectory, type Directory } from "./people-data";
import { IMPORT_COLUMNS, type ImportField } from "./people-import";

/* Berkas Excel untuk template impor dan ekspor data jemaat. */

const HEADER_STYLE = { fontWeight: "bold" as const, backgroundColor: "#FCBC04", color: "#0C1414" };
const columns = IMPORT_COLUMNS.map((column) => ({ width: column.width }));
const header = () => IMPORT_COLUMNS.map((column) => ({ value: column.title, ...HEADER_STYLE }));

/** "yyyy-mm-dd" → Date tengah malam UTC, supaya Excel menampilkannya sebagai tanggal. */
const asDate = (value: string | null) => (value ? { value: new Date(`${value}T00:00:00Z`), type: Date, format: "dd/mm/yyyy" } : null);

export const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function attachment(name: string) {
  return {
    "Content-Type": XLSX_TYPE,
    "Content-Disposition": `attachment; filename="${name}"`,
    "Cache-Control": "no-store",
  };
}

export async function buildTemplate(dir: Directory) {
  const guide = [
    [{ value: "Kolom", ...HEADER_STYLE }, { value: "Keterangan", ...HEADER_STYLE }],
    ...IMPORT_COLUMNS.map((column) => [{ value: column.title, fontWeight: "bold" as const }, column.hint || null]),
    [null, null],
    [{ value: "Catatan", fontWeight: "bold" as const }, "Satu baris untuk satu orang. Judul kolom boleh pakai sebutan lain, mis. No WA atau Tgl Lahir."],
    [null, "Data yang sudah ada (nomor WA atau nama sama) bisa dilewati atau diperbarui, dipilih saat impor."],
    [null, "Kolom kosong tidak menghapus data yang sudah ada."],
  ];
  const lists = Math.max(Object.keys(PERSON_STATUS_LABEL).length, dir.lifeGroups.length, dir.teams.length, 2);
  const options = [
    [{ value: "Status", ...HEADER_STYLE }, { value: "Life Group", ...HEADER_STYLE }, { value: "Peran di Life Group", ...HEADER_STYLE }, { value: "Pelayanan", ...HEADER_STYLE }],
    ...Array.from({ length: lists }, (_, i) => [
      Object.values(PERSON_STATUS_LABEL)[i] ?? null,
      dir.lifeGroups[i]?.name ?? null,
      Object.values(LIFE_GROUP_ROLE_LABEL)[i] ?? null,
      dir.teams[i]?.name ?? null,
    ]),
  ];
  const example = (cells: Partial<Record<ImportField, unknown>>) => IMPORT_COLUMNS.map((column) => (cells[column.field] ?? null) as never);

  return writeXlsxFile([
    { sheet: "Jemaat", data: [header()], columns, stickyRowsCount: 1 },
    {
      sheet: "Contoh",
      data: [
        header(),
        example({
          full_name: "Budi Santoso",
          nickname: "Budi",
          gender: "L",
          birth_place: "Jakarta",
          birth_date: "28/11/1984",
          phone: "0812 1111 2222",
          area: "Kelapa Gading",
          status: "Jemaat aktif",
          life_group: dir.lifeGroups[0]?.name ?? "Family Kelapa Gading",
          life_group_role: "Leader",
          teams: "Usher: Pintu depan",
          spouse: "Anita Santoso",
          married_on: "12/06/2010",
        }),
        example({
          full_name: "Anita Santoso",
          nickname: "Ani",
          gender: "P",
          birth_date: "5 Desember 1987",
          phone: "0813 3333 4444",
          area: "Kelapa Gading",
          life_group: dir.lifeGroups[0]?.name ?? "Family Kelapa Gading",
          teams: "Usher; Kids Church: Guru kelas kecil",
          spouse: "Budi Santoso",
        }),
      ],
      columns,
      stickyRowsCount: 1,
    },
    { sheet: "Petunjuk", data: guide, columns: [{ width: 24 }, { width: 90 }] },
    { sheet: "Pilihan", data: options, columns: [{ width: 18 }, { width: 28 }, { width: 20 }, { width: 22 }] },
  ]).toBuffer();
}

export async function buildExport(dir: Directory) {
  const index = indexDirectory(dir);
  const rows = dir.people.map((person) => {
    const group = person.life_group_id ? index.groupsById.get(person.life_group_id) : undefined;
    const spouse = familyOf(person, dir.relationships, index.peopleById).find((member) => member.as === "pasangan");
    const marriedOn = spouse ? dir.relationships.find((rel) => rel.id === spouse.relationshipId)?.married_on ?? null : null;
    const teams = (index.membershipsByPerson.get(person.id) ?? [])
      .map((member) => {
        const team = index.teamsById.get(member.team_id);
        return team ? `${team.name}${member.role ? `: ${member.role}` : ""}` : null;
      })
      .filter(Boolean)
      .join("; ");

    const cells: Record<ImportField, unknown> = {
      full_name: person.full_name,
      nickname: person.nickname,
      gender: person.gender,
      birth_place: person.birth_place,
      birth_date: asDate(person.birth_date),
      phone: person.phone,
      email: person.email,
      address: person.address,
      area: person.area,
      occupation: person.occupation,
      status: PERSON_STATUS_LABEL[person.status],
      life_group: group?.name ?? null,
      life_group_role: group ? LIFE_GROUP_ROLE_LABEL[person.life_group_role] : null,
      teams: teams || null,
      joined_on: asDate(person.joined_on),
      baptized_on: asDate(person.baptized_on),
      spouse: spouse?.person.full_name ?? null,
      married_on: asDate(marriedOn),
      notes: person.notes,
      id: person.id,
    };
    return IMPORT_COLUMNS.map((column) => (cells[column.field] ?? null) as never);
  });

  return writeXlsxFile([header(), ...rows], { columns, stickyRowsCount: 1, sheet: `Jemaat ${todayWib()}` }).toBuffer();
}
