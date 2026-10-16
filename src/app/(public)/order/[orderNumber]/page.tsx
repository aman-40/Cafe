import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { OrderTracker } from "./order-tracker";
import { Metadata } from "next";

export async function generateMetadata(props: { params: Promise<{ orderNumber: string }> }): Promise<Metadata> {
  const params = await props.params;
  return { title: `Order ${params.orderNumber} | Premium Café` };
}

export default async function OrderPage(props: { params: Promise<{ orderNumber: string }> }) {
  const params = await props.params;
  const order = await prisma.order.findUnique({
    where: { orderNumber: params.orderNumber },
    include: {
      items: true,
      table: true,
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    }
  });

  if (!order) {
    notFound();
  }

  // Pass plain data to client component
  const orderData = {
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
  };

  return <OrderTracker initialOrder={orderData} />;
}
