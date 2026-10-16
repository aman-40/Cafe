import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function NotificationDetailPage(props: { params: Promise<{ id: string }> }) {
  await requirePermission("SETTINGS_VIEW");
  
  const params = await props.params;
  const notification = await prisma.notification.findUnique({
    where: { id: params.id }
  });

  if (!notification) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center">
        <Link href="/admin/notifications">
          <Button variant="ghost" size="sm" className="-ml-4 mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Notification Details</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden p-6 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
            <span className={`px-3 py-1 text-xs rounded-full font-medium ${
              notification.status === "SENT" ? "bg-green-100 text-green-700" :
              notification.status === "FAILED" ? "bg-red-100 text-red-700" :
              "bg-yellow-100 text-yellow-700"
            }`}>
              {notification.status}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Type</h3>
            <p className="font-semibold">{notification.type.replace(/_/g, " ")}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Channel</h3>
            <p>{notification.channel}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Provider</h3>
            <p>{notification.provider || "None"}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Recipient</h3>
            <p className="font-medium text-blue-600">{notification.recipient}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Provider Message ID</h3>
            <p className="text-sm text-gray-600 break-all">{notification.providerMessageId || "-"}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Reference</h3>
            <p>{notification.referenceType ? `${notification.referenceType} (${notification.referenceId})` : "None"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Attempts</h3>
            <p>{notification.attempts}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Created At</h3>
            <p>{format(new Date(notification.createdAt), "MMM d, yyyy h:mm a")}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Sent At</h3>
            <p>{notification.sentAt ? format(new Date(notification.sentAt), "MMM d, yyyy h:mm a") : "-"}</p>
          </div>
        </div>

        {notification.errorMessage && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
            <h3 className="text-sm font-medium text-red-800 mb-2">Error Message</h3>
            <p className="text-sm text-red-600 font-mono break-all">{notification.errorMessage}</p>
          </div>
        )}

        <div className="mt-8 border-t pt-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Message Content</h3>
          {notification.subject && (
            <div className="mb-4">
              <strong className="text-sm text-gray-500 block mb-1">Subject:</strong>
              <div className="bg-gray-50 px-4 py-2 rounded border text-sm">{notification.subject}</div>
            </div>
          )}
          <div>
            <strong className="text-sm text-gray-500 block mb-1">Body:</strong>
            <div className="bg-gray-50 px-4 py-3 rounded border text-sm whitespace-pre-wrap font-mono">
              {notification.message}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
