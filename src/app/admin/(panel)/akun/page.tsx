import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader, Badge, Card, Notice } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { PasswordForm } from "@/components/portal/forms";
import { adminDb } from "@/lib/admin-auth";
import { getSession } from "@/lib/auth";
import { MIN_LEADER_PASSWORD_LENGTH } from "@/lib/password";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Akun saya" };
export const dynamic = "force-dynamic";

export default async function AdminAccountPage({ searchParams }: { searchParams: Promise<{ wajib?: string }> }) {
  const { wajib } = await searchParams;
  await adminDb({ allowPasswordChange: true });
  const { account, lifeGroup } = (await getSession())!;

  return (
    <>
      <AdminPageHeader title="Akun saya" description="Data masuk dan password kamu." />
      {(wajib || account.must_change_password) && (
        <div className="mb-6">
          <Notice tone="error">Kamu masih memakai password sementara. Buat password baru dulu sebelum membuka halaman lain.</Notice>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <Card className="space-y-4 p-5">
          <div>
            <p className="font-display text-lg font-bold text-ink">{account.name}</p>
            <p className="text-sm break-all text-ink-soft">{account.email}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="navy">Admin</Badge>
            {lifeGroup && <Badge tone="sun">Leader {lifeGroup.name}</Badge>}
          </div>
          {account.last_login_at && <p className="text-xs text-ink-soft">Terakhir masuk {formatDateTime(account.last_login_at)}</p>}
          {lifeGroup && !account.must_change_password && (
            <Link href="/portal" className="btn btn-sun w-full px-4 py-2.5 text-sm">
              <Icon.home className="h-4 w-4" /> Buka portal Life Group
            </Link>
          )}
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="font-display mb-4 text-lg font-bold text-ink">Ganti password</h2>
          <div className="max-w-md">
            <PasswordForm minLength={MIN_LEADER_PASSWORD_LENGTH} />
          </div>
        </Card>
      </div>
    </>
  );
}
