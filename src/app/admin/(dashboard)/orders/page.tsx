import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { KanbanBoard } from "./kanban-board";
import { OrderStatus } from "@prisma/client";

export const metadata = { title: "Kitchen Dashboard | Admin" };

export default async function OrdersPage() {
  await requirePermission("KITCHEN_VIEW");

  const activeOrders = await prisma.order.findMany({
    where: {
      status: {
        in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY]
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
    orderBy: { createdAt: 'asc' }
  });

  // Convert Decimals to Numbers for client components
  const parsedOrders = activeOrders.map(order => ({
    ...order,
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    discount: Number(order.discount),
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map(item => ({
      ...item,
      price: Number(item.price),
      subtotal: Number(item.subtotal),
    }))
  }));

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Kitchen Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage and track active orders.</p>
      </div>
      <KanbanBoard initialOrders={parsedOrders} />
    </div>
  );
}
