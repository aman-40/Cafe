"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type CheckoutInput = {
  tableNumber: string;
  customerName?: string;
  customerPhone?: string;
  orderNotes?: string;
  paymentMethod: "ONLINE" | "CASH";
  items: {
    menuItemId: string;
    quantity: number;
    notes?: string;
  }[];
};

export async function createOrder(input: CheckoutInput) {
  try {
    const table = await prisma.cafeTable.findUnique({
      where: { tableNumber: input.tableNumber }
    });

    if (!table || !table.isActive) return { error: "Invalid or inactive table." };
    if (input.items.length === 0) return { error: "Order cannot be empty." };

    const itemIds = input.items.map(i => i.menuItemId);
    const dbItems = await prisma.menuItem.findMany({ 
      where: { id: { in: itemIds } },
      include: {
        ingredients: {
          include: { inventoryItem: true }
        }
      }
    });
    const dbItemsMap = new Map(dbItems.map(i => [i.id, i]));

    let subtotal = 0;
    const orderItemsData: { menuItemId: string; name: string; price: number; quantity: number; subtotal: number; notes: string | null; }[] = [];
    const inventoryRequired = new Map<string, { name: string; amount: number; currentStock: number }>();

    for (const clientItem of input.items) {
      const dbItem = dbItemsMap.get(clientItem.menuItemId);
      if (!dbItem) return { error: "One or more items are invalid." };
      if (!dbItem.isAvailable) return { error: `Item ${dbItem.name} is currently unavailable.` };

      // Aggregate required inventory
      for (const ingredient of dbItem.ingredients) {
        const requiredAmount = Number(ingredient.quantity) * clientItem.quantity;
        const currentReq = inventoryRequired.get(ingredient.inventoryItemId) || { 
          name: ingredient.inventoryItem.name, 
          amount: 0, 
          currentStock: Number(ingredient.inventoryItem.currentStock) 
        };
        currentReq.amount += requiredAmount;
        inventoryRequired.set(ingredient.inventoryItemId, currentReq);
      }

      const price = Number(dbItem.price);
      const itemSubtotal = price * clientItem.quantity;
      subtotal += itemSubtotal;

      orderItemsData.push({
        menuItemId: dbItem.id,
        name: dbItem.name,
        price,
        quantity: clientItem.quantity,
        subtotal: itemSubtotal,
        notes: clientItem.notes || null,
      });
    }

    // Validate inventory capacity
    for (const [id, req] of inventoryRequired.entries()) {
      if (req.amount > req.currentStock) {
        return { error: `Insufficient inventory for ${req.name}. Please adjust your order.` };
      }
    }

    const tax = 0;
    const discount = 0;
    const total = subtotal + tax - discount;

    const orderCount = await prisma.order.count();
    const orderNumber = `ORD-${1000 + orderCount + 1}`;

    // Create Order and Payment in Transaction
    const result = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          tableId: table.id,
          subtotal,
          tax,
          discount,
          total,
          customerName: input.customerName || null,
          customerPhone: input.customerPhone || null,
          notes: input.orderNotes || null,
          status: "PENDING",
          items: { create: orderItemsData }
        }
      });

      if (input.paymentMethod === "ONLINE") {
        const { paymentService } = await import("@/lib/payment-service");
        const rzpOrder = await paymentService.createOrder({
          amount: total,
          currency: "INR",
          receipt: newOrder.id,
        });

        await tx.payment.create({
          data: {
            orderId: newOrder.id,
            provider: paymentService.providerName,
            providerOrderId: rzpOrder.id,
            amount: total,
            currency: "INR",
            status: "PENDING",
            method: "ONLINE"
          }
        });

        return { success: true, orderNumber: newOrder.orderNumber, rzpOrderId: rzpOrder.id, total, id: newOrder.id };
      } else {
        await tx.payment.create({
          data: {
            orderId: newOrder.id,
            provider: "CASH",
            amount: total,
            currency: "INR",
            status: "PENDING",
            method: "CASH"
          }
        });
        return { success: true, orderNumber: newOrder.orderNumber, total, id: newOrder.id };
      }
    });

    revalidatePath("/admin/orders");

    // Notification
    const settings = await prisma.notificationSettings.findFirst() || { orderEmail: true, orderWhatsapp: false };
    const channels: import("@prisma/client").NotificationChannel[] = [];
    if (settings.orderEmail) channels.push("EMAIL");
    if (settings.orderWhatsapp) channels.push("WHATSAPP");

    if (channels.length > 0) {
      const { notificationService } = await import("@/lib/notification-service");
      await notificationService.notify(
        "ORDER_CREATED",
        channels,
        (channel) => channel === "EMAIL" ? null : (input.customerPhone || null),
        {
          customerName: input.customerName,
          orderNumber: result.orderNumber,
          tableNumber: input.tableNumber,
          total: result.total,
          paymentMethod: input.paymentMethod,
        },
        { type: "ORDER", id: result.id }
      );
    }

    return result;

  } catch (error) {
    console.error("Order creation error", error);
    return { error: "Failed to create order. Please try again." };
  }
}
