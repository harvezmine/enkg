/** Batas booklet materi Life Group. File diunggah langsung dari browser ke Supabase Storage, tidak lewat nginx/Next. */
export const MATERIAL_MAX_BYTES = 25 * 1024 * 1024;
export const MATERIAL_MAX_MB = MATERIAL_MAX_BYTES / (1024 * 1024);

/** Path booklet di bucket enkg-materials: "<uuid>.pdf". Path lain ditolak server. */
export const MATERIAL_PATH = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/;
