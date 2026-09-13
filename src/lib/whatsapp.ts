/**
 * Link wa.me. Pesan di-encode dengan encodeURIComponent (spasi → %20), bukan
 * URLSearchParams (spasi → +), karena beberapa klien WhatsApp menampilkan "+"
 * apa adanya.
 */
export function whatsappLink(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^0/, "62");
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
