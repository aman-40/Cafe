import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { StaffList } from "./staff-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function StaffPage() {
  await requirePermission("STAFF_VIEW");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      shifts: {
        where: { status: 'ACTIVE' },
        take: 1
      },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-gray-900">Staff Members</h1>
          <p className="text-muted-foreground mt-1">Manage staff roles, permissions, and status</p>
        </div>
        <Link href="/admin/staff/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Staff Member
          </Button>
        </Link>
      </div>

      <StaffList initialUsers={users} />
    </div>
  );
}
