import type { Metadata } from "next";

import { AdminPageHeader, Card } from "@/components/admin/ui";
import { MeetingForm } from "@/components/portal/forms";
import { requireLeader } from "@/lib/leader-auth";
import { groupMaterials, nextRegularMeeting } from "@/lib/portal-data";

export const metadata: Metadata = { title: "Jadwalkan pertemuan" };
export const dynamic = "force-dynamic";

export default async function NewMeetingPage() {
  const context = await requireLeader();
  const { materials } = await groupMaterials(context);

  return (
    <>
      <AdminPageHeader title="Jadwalkan pertemuan" backHref="/portal/pertemuan" />
      <Card className="max-w-2xl p-5 sm:p-6">
        <MeetingForm
          materials={materials.map(({ id, title }) => ({ id, title }))}
          defaultPlace={context.lifeGroup.location}
          defaultStart={nextRegularMeeting(context)}
        />
      </Card>
    </>
  );
}
