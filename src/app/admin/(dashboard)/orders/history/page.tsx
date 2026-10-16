import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { format } from "date-fns";

export const metadata = { title: "Order History | Admin" };

export default async function OrderHistoryPage() {
  await requirePermission("ORDERS_VIEW");

  const pastOrders = await prisma.order.findMany({
    where: {
      status: {
        in: [OrderStatus.COMPLETED, OrderStatus.CANCELLED]
      }
    },
    include: {
      items: true,
      table: true,
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100, // Limit to recent 100 for simplicity
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Order History</h1>
        <p className="text-sm text-muted-foreground">View recently completed or cancelled orders.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Table</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pastOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No past orders found.
                  </td>
                </tr>
              ) : (
                pastOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium">{order.orderNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                      {format(new Date(order.createdAt), "MMM d, yyyy h:mm a")}
                    </td>
                    <td className="px-6 py-4">
                      {order.table ? `Table ${order.table.tableNumber}` : "-"}
                    </td>
                    <td className="px-6 py-4">
                      {order.customerName || "-"}
                    </td>
                    <td className="px-6 py-4">
                      {order.payments && order.payments.length > 0 ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          order.payments[0].status === "PAID" 
                            ? "bg-green-100 text-green-800" 
                            : order.payments[0].status === "FAILED"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {order.payments[0].status}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                        order.status === "COMPLETED" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold">
                      ₹{Number(order.total)}
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
