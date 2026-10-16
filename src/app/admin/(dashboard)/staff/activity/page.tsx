import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { ActivityList } from "./activity-list";

export default async function ActivityPage() {
  await requirePermission("STAFF_VIEW");

  const activities = await prisma.staffActivity.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100, // Limit to 100 recent for now to prevent massive payloads, could be paginated later
    include: {
      user: {
        select: { name: true, role: true }
      }
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif text-gray-900">Activity Log</h1>
        <p className="text-muted-foreground mt-1">Audit trail of important operational actions</p>
      </div>

      <ActivityList initialActivities={activities} />
    </div>
  );
}
