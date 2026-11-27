import { PageNotFound } from "@/components/admin/page-states";

export default function PortalNotFound() {
  return (
    <PageNotFound
      homeHref="/portal"
      homeLabel="Ke beranda portal"
      text="Mungkin datanya sudah dihapus, atau bukan bagian dari Life Group kamu."
    />
  );
}
