/** Jenis pengingat bot Telegram. File ini aman diimpor komponen browser. */
export const TOPICS = ["ulang_tahun", "anniversary", "jadwal", "jemaat_baru", "doa"] as const;
export type Topic = (typeof TOPICS)[number];

export const TOPIC_LABEL: Record<Topic, string> = {
  ulang_tahun: "Ulang tahun",
  anniversary: "Anniversary pernikahan",
  jadwal: "Jadwal gereja",
  jemaat_baru: "Jemaat baru",
  doa: "Permohonan doa",
};

/** Penjelasan singkat untuk admin saat memilih pengingat. */
export const TOPIC_HINT: Record<Topic, string> = {
  ulang_tahun: "Siapa yang berulang tahun hari ini dan seminggu ke depan.",
  anniversary: "Pasangan yang merayakan ulang tahun pernikahan.",
  jadwal: "Jadwal ibadah dan kegiatan hari ini dan besok.",
  jemaat_baru: "Pendaftar baru, bisa langsung dimasukkan ke Life Group dari Telegram.",
  doa: "Permohonan doa yang masuk lewat situs.",
};

export const isTopic = (value: unknown): value is Topic => TOPICS.includes(value as Topic);
