import type { Metadata } from "next";

import { portalSignOut } from "@/app/actions/portal";
import { AdminPageHeader, Card, Notice } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { PasswordForm } from "@/components/portal/forms";
import { requireLeader } from "@/lib/leader-auth";
import { MIN_LEADER_PASSWORD_LENGTH } from "@/lib/password";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Akun" };
export const dynamic = "force-dynamic";

export default async function PortalAccountPage({ searchParams }: { searchParams: Promise<{ wajib?: string }> }) {
  const { wajib } = await searchParams;
  const { account, person, lifeGroup } = await requireLeader({ allowPasswordChange: true });
  const forced = account.must_change_password;

  return (
    <>
      <AdminPageHeader
        title={forced ? "Buat password baru" : "Akun"}
        description={forced ? "Kamu masih memakai password sementara dari admin. Ganti dulu sebelum lanjut." : undefined}
      />
      {forced && wajib && (
        <div className="mb-6 max-w-xl">
          <Notice tone="error">Demi keamanan data anggota, password sementara harus diganti dulu.</Notice>
        </div>
      )}

      <div className="grid max-w-4xl gap-6 lg:grid-cols-[1fr_18rem]">
        <Card className="p-5 sm:p-6">
          <h2 className="font-display mb-4 text-lg font-bold text-ink">Ganti password</h2>
          <PasswordForm minLength={MIN_LEADER_PASSWORD_LENGTH} />
        </Card>

        <Card className="h-fit p-5">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-ink-soft">Nama</dt>
              <dd className="font-semibold text-ink">{person.full_name}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Leader di</dt>
              <dd className="font-semibold text-ink">{lifeGroup.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Nomor untuk masuk</dt>
              <dd className="tabular font-semibold text-ink">{account.login}</dd>
            </div>
            {account.last_login_at && (
              <div>
                <dt className="text-xs text-ink-soft">Terakhir masuk</dt>
                <dd className="text-ink">{formatDateTime(account.last_login_at)}</dd>
              </div>
            )}
          </dl>
          <form action={portalSignOut} className="mt-5 border-t border-ink/8 pt-4">
            <button type="submit" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-red-700">
              <Icon.logout className="h-4 w-4" /> Keluar
            </button>
          </form>
        </Card>
      </div>
    </>
  );
}
