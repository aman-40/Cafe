import { requirePermission } from "@/lib/permissions";
import { StaffForm } from "./staff-form";
import { getAdminUser } from "@/lib/auth";

export default async function NewStaffPage() {
  const admin = await requirePermission("STAFF_MANAGE");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif text-gray-900">New Staff Member</h1>
        <p className="text-muted-foreground mt-1">Create a new staff profile and invite them</p>
      </div>

      <StaffForm adminRole={admin.role} />
    </div>
  );
}
