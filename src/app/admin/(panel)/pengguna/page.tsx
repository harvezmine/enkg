import type { Metadata } from "next";
import Link from "next/link";

import { DbError } from "@/components/admin/db-error";
import { AccountActions, AccountSummary, NewAccountForm, type AccountView } from "@/components/admin/people/account-panel";
import { AdminPageHeader, Card, EmptyState } from "@/components/admin/ui";
import { Icon } from "@/components/icons";
import { adminDb } from "@/lib/admin-auth";
import { getSession } from "@/lib/auth";
import { TABLES } from "@/lib/db-types";
import { todayWib } from "@/lib/people";
import { indexDirectory, loadDirectory } from "@/lib/people-data";
import { pickerOption } from "@/lib/people-options";

export const metadata: Metadata = { title: "Pengguna & akses" };
export const dynamic = "force-dynamic";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ baru?: string }> }) {
  const { baru } = await searchParams;
  const supabase = await adminDb();
  const [session, accountsResult, dir] = await Promise.all([
    getSession(),
    supabase
      .from(TABLES.accounts)
      .select("id, email, name, person_id, is_admin, is_active, must_change_password, last_login_at, created_at, updated_at")
      .order("is_admin", { ascending: false })
      .order("name"),
    loadDirectory(supabase),
  ]);
  const accounts = (accountsResult.data ?? []) as AccountView[];
  const index = indexDirectory(dir);
  const today = todayWib();

  /** Nama LG kalau orang yang ditautkan memang leader grup aktif (sama dengan aturan akses portal). */
  const leaderOf = (personId: string | null) => {
    const person = personId ? index.peopleById.get(personId) : undefined;
    if (!person || person.life_group_role !== "leader" || !person.life_group_id) return null;
    const group = index.groupsById.get(person.life_group_id);
    return group?.is_active ? group.name : null;
  };
  const linked = new Set(accounts.map((a) => a.person_id).filter(Boolean));
  const candidates = dir.people.filter((p) => !linked.has(p.id)).map((p) => pickerOption(p, today, index.groupsById));
  const leadersWithout = dir.people.filter(
    (p) => p.life_group_role === "leader" && p.life_group_id && !linked.has(p.id) && index.groupsById.get(p.life_group_id)?.is_active,
  );

  return (
    <>
      <AdminPageHeader
        title="Pengguna & akses"
        description="Siapa saja yang bisa masuk. Admin membuka admin panel; leader Life Group membuka portal LG-nya. Masuk pakai email dan password."
        action={
          !baru && (
            <Link href="/admin/pengguna?baru=1" className="btn btn-navy px-4 py-2.5 text-sm">
              <Icon.plus className="h-4 w-4" /> Tambah pengguna
            </Link>
          )
        }
      />
      <DbError error={accountsResult.error ?? dir.error} />

      {baru && (
        <Card className="mb-8 p-4 sm:p-6">
          <h2 className="font-display mb-1 text-lg font-bold text-ink">Pengguna baru</h2>
          <p className="mb-5 text-sm text-ink-soft">
            Password sementara muncul setelah akun dibuat. Kirim ke orangnya; saat pertama masuk ia wajib menggantinya.
          </p>
          <NewAccountForm people={candidates} />
        </Card>
      )}

      {leadersWithout.length > 0 && (
        <Card className="mb-8 p-4 sm:p-5">
          <p className="text-sm font-semibold text-ink">Leader yang belum punya akun</p>
          <p className="mt-1 text-sm text-ink-soft">Buat akunnya dari halaman data masing-masing, supaya mereka bisa masuk ke portal Life Group.</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {leadersWithout.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/jemaat/${p.id}#akun-portal`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-sun-400/20 px-3.5 py-2 text-sm font-semibold text-ink ring-1 ring-sun-500/40 transition hover:bg-sun-400/30"
                >
                  {p.full_name}
                  <Icon.arrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {accounts.length ? (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {accounts.map((account) => {
            const person = account.person_id ? index.peopleById.get(account.person_id) : undefined;
            return (
              <li key={account.id}>
                <Card className="h-full space-y-4 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-lg leading-snug font-bold text-ink">{account.name}</p>
                      {person ? (
                        <Link href={`/admin/jemaat/${person.id}`} className="text-xs font-semibold text-navy-700 hover:underline">
                          Data jemaat: {person.full_name}
                        </Link>
                      ) : (
                        <p className="text-xs text-ink-soft">Belum ditautkan ke data jemaat</p>
                      )}
                    </div>
                  </div>
                  <AccountSummary account={account} leaderOf={leaderOf(account.person_id)} />
                  <div className="border-t border-ink/8 pt-3">
                    <AccountActions account={account} isSelf={account.id === session?.account.id} />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : (
        !accountsResult.error && <EmptyState title="Belum ada pengguna" description="Tambahkan admin atau leader Life Group." />
      )}
    </>
  );
}
