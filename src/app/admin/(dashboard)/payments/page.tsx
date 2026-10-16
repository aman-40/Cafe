import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export const metadata = { title: "Payment History | Admin" };

export default async function PaymentsPage() {
  await requirePermission("PAYMENTS_VIEW");

  const payments = await prisma.payment.findMany({
    include: {
      order: {
        include: {
          table: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100, // Limit to 100 for simplicity
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Payment History</h1>
        <p className="text-sm text-muted-foreground">View all transactions and payment statuses.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Payment ID</th>
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method / Provider</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{payment.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{payment.order.orderNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        {payment.order.table ? `Table ${payment.order.table.tableNumber}` : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold">
                      ₹{Number(payment.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <div>{payment.method || "-"}</div>
                      <div className="text-xs text-muted-foreground">{payment.provider}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                        payment.status === "PAID" 
                          ? "bg-green-100 text-green-800" 
                          : payment.status === "FAILED"
                          ? "bg-red-100 text-red-800"
                          : payment.status === "REFUNDED"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {format(new Date(payment.createdAt), "MMM d, yyyy h:mm a")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
