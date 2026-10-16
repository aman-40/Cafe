import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { format, differenceInMinutes, differenceInHours } from "date-fns";
import { ShiftControls } from "./shift-controls";

export default async function ShiftsPage() {
  const admin = await requirePermission("STAFF_VIEW");

  const activeShift = await prisma.staffShift.findFirst({
    where: { userId: admin.id, status: "ACTIVE" }
  });

  const shifts = await prisma.staffShift.findMany({
    orderBy: { startedAt: 'desc' },
    take: 50,
    include: {
      user: {
        select: { name: true, role: true, position: true }
      }
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-gray-900">Shift Management</h1>
          <p className="text-muted-foreground mt-1">Track staff presence and hours</p>
        </div>
        
        <ShiftControls hasActiveShift={!!activeShift} />
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Staff Member</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Started</th>
              <th className="px-6 py-4">Ended</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {shifts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  No shift records found.
                </td>
              </tr>
            ) : (
              shifts.map((shift) => {
                const isCompleted = shift.status === 'COMPLETED' && shift.endedAt;
                let duration = '—';
                if (isCompleted) {
                  const hrs = differenceInHours(shift.endedAt!, shift.startedAt);
                  const mins = differenceInMinutes(shift.endedAt!, shift.startedAt) % 60;
                  duration = `${hrs}h ${mins}m`;
                }

                return (
                  <tr key={shift.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{shift.user.name}</div>
                      <div className="text-xs text-muted-foreground">{shift.user.position || shift.user.role}</div>
                    </td>
                    <td className="px-6 py-4">{format(shift.startedAt, 'MMM d, yyyy')}</td>
                    <td className="px-6 py-4 font-medium">{format(shift.startedAt, 'h:mm a')}</td>
                    <td className="px-6 py-4">{shift.endedAt ? format(shift.endedAt, 'h:mm a') : '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{duration}</td>
                    <td className="px-6 py-4 text-right">
                      {shift.status === 'ACTIVE' ? (
                        <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">ACTIVE</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-medium">COMPLETED</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
