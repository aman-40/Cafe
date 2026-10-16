import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { format } from "date-fns";

export default async function NotificationLogsPage() {
  await requirePermission("REPORTS_VIEW"); // Assuming REPORTS_VIEW or ANALYTICS_VIEW or SETTINGS_VIEW is fine. Let's just use SETTINGS_VIEW.
  
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notification Logs</h1>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase font-medium border-b">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Channel</th>
                <th className="px-6 py-4">Recipient</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Attempts</th>
                <th className="px-6 py-4">Error</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {notifications.map((n) => (
                <tr key={n.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {format(new Date(n.createdAt), "MMM d, yyyy h:mm a")}
                  </td>
                  <td className="px-6 py-4 font-medium">{n.type.replace(/_/g, " ")}</td>
                  <td className="px-6 py-4">{n.channel}</td>
                  <td className="px-6 py-4">{n.recipient}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      n.status === "SENT" ? "bg-green-100 text-green-700" :
                      n.status === "FAILED" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {n.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{n.attempts}</td>
                  <td className="px-6 py-4 text-xs text-red-500 truncate max-w-xs">{n.errorMessage || "-"}</td>
                  <td className="px-6 py-4">
                    <a href={`/admin/notifications/${n.id}`} className="text-primary hover:underline text-sm font-medium">View</a>
                  </td>
                </tr>
              ))}
              {notifications.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No notifications sent yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
