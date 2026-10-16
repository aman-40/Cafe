import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { notFound } from "next/navigation";
import { StaffForm } from "../new/staff-form";
import { StaffDetailClient } from "./staff-detail-client";

export default async function StaffDetailPage(
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const admin = await requirePermission("STAFF_MANAGE");

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      shifts: {
        orderBy: { startedAt: 'desc' },
        take: 5
      },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <StaffDetailClient user={user} adminRole={admin.role} adminId={admin.id} />
      
      <div className="pt-6 border-t">
        <h2 className="text-xl font-bold font-serif text-gray-900 mb-6">Edit Profile</h2>
        <StaffForm adminRole={admin.role} initialData={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          position: user.position,
          permissions: user.permissions
        }} />
      </div>
    </div>
  );
}
