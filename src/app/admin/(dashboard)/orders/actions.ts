"use server";

import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { requirePermission, logActivity } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const admin = await requirePermission("KITCHEN_MANAGE");

  try {
    const alerts: { type: import("@prisma/client").NotificationType; item: Record<string, unknown> }[] = [];
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              menuItem: {
                include: {
                  ingredients: true
                }
              }
            }
          }
        }
      });

      if (!order) throw new Error("Order not found");

      // Deduct inventory when transitioning from PENDING to CONFIRMED
      if (order.status === OrderStatus.PENDING && status === OrderStatus.CONFIRMED) {
        const inventoryRequired = new Map<string, number>();

        for (const orderItem of order.items) {
          if (!orderItem.menuItem) continue;
          for (const ingredient of orderItem.menuItem.ingredients) {
            const requiredAmount = Number(ingredient.quantity) * orderItem.quantity;
            inventoryRequired.set(
              ingredient.inventoryItemId, 
              (inventoryRequired.get(ingredient.inventoryItemId) || 0) + requiredAmount
            );
          }
        }

        // Apply deduction atomically
        for (const [inventoryItemId, amount] of inventoryRequired.entries()) {
          // Check for idempotency: has this order already deducted?
          const existingTx = await tx.inventoryTransaction.findFirst({
            where: {
              inventoryItemId,
              referenceId: order.id,
              type: "SALE"
            }
          });

          if (existingTx) continue; // Already deducted

          const inventoryItem = await tx.inventoryItem.findUnique({
            where: { id: inventoryItemId }
          });

          if (!inventoryItem) continue;
          const previousStock = Number(inventoryItem.currentStock);
          const newStock = previousStock - amount;

          if (newStock < 0) {
            throw new Error(`Insufficient stock for ${inventoryItem.name}`);
          }

          if (newStock <= 0) {
            tx.inventoryItem.update({ where: { id: inventoryItemId }, data: { currentStock: newStock } }).then();
            alerts.push({ type: "OUT_OF_STOCK_ALERT", item: { ...inventoryItem, currentStock: newStock } });
          } else if (newStock <= Number(inventoryItem.minimumStock)) {
            alerts.push({ type: "LOW_STOCK_ALERT", item: { ...inventoryItem, currentStock: newStock } });
          }

          await tx.inventoryItem.update({
            where: { id: inventoryItemId },
            data: { currentStock: newStock }
          });

          await tx.inventoryTransaction.create({
            data: {
              inventoryItemId,
              type: "SALE",
              quantity: -amount,
              previousStock,
              newStock,
              reason: `Order ${order.orderNumber}`,
              referenceId: order.id,
              createdBy: admin.id
            }
          });
        }
      }

      await tx.order.update({
        where: { id },
        data: { status },
      });
    });
    
    // We revalidate both the admin dashboard and the public order page
    revalidatePath("/admin/orders");
    revalidatePath("/admin/orders/history");

    // Process inventory alerts if any
    if (alerts.length > 0) {
      const settings = await prisma.notificationSettings.findFirst() || { inventoryAlerts: true };
      if (settings.inventoryAlerts) {
        const managers = await prisma.user.findMany({
          where: { isActive: true, OR: [{ role: "OWNER" }, { permissions: { has: "INVENTORY_MANAGE" } }] }
        });
        const { notificationService } = await import("@/lib/notification-service");
        
        for (const alert of alerts) {
          for (const manager of managers) {
            await notificationService.notifyIdempotent(
              alert.type,
              ["EMAIL"], // Always send internal alerts via email
              () => manager.email,
              { itemName: alert.item.name, currentStock: alert.item.currentStock, minimumStock: alert.item.minimumStock, unit: alert.item.unit },
              { type: "INVENTORY", id: `${alert.item.id}-${manager.id}` }
            );
          }
        }
      }
    }

    // Notification
    const settings = await prisma.notificationSettings.findFirst() || { orderEmail: true, orderWhatsapp: false };
    const channels: import("@prisma/client").NotificationChannel[] = [];
    if (settings.orderEmail) channels.push("EMAIL");
    if (settings.orderWhatsapp) channels.push("WHATSAPP");

    if (channels.length > 0) {
      const typeMap: Record<string, import("@prisma/client").NotificationType> = {
        CONFIRMED: "ORDER_CONFIRMED",
        PREPARING: "ORDER_PREPARING",
        READY: "ORDER_READY",
        COMPLETED: "ORDER_COMPLETED"
      };
      
      const notifType = typeMap[status];
      
      if (notifType) {
        // We need the latest order info, but we already have `id` and can just query it
        const latestOrder = await prisma.order.findUnique({ where: { id }});
        if (latestOrder && (latestOrder.customerPhone || latestOrder.customerName)) {
          const { notificationService } = await import("@/lib/notification-service");
          await notificationService.notify(
            notifType,
            channels,
            (channel) => channel === "EMAIL" ? null : (latestOrder.customerPhone || null),
            {
              customerName: latestOrder.customerName,
              orderNumber: latestOrder.orderNumber,
            },
            { type: "ORDER", id }
          );
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update order status", error);
    throw new Error("Failed to update order status");
  }
}

export async function updatePaymentStatus(paymentId: string, status: PaymentStatus) {
  const admin = await requirePermission("PAYMENTS_MANAGE");

  try {
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status },
      include: { order: true }
    });
    
    revalidatePath("/admin/orders");
    revalidatePath("/admin/payments");

    // Notification
    const settings = await prisma.notificationSettings.findFirst() || { paymentEmail: true, paymentWhatsapp: false };
    const channels: import("@prisma/client").NotificationChannel[] = [];
    if (settings.paymentEmail) channels.push("EMAIL");
    if (settings.paymentWhatsapp) channels.push("WHATSAPP");

    if (channels.length > 0) {
      const typeMap: Record<string, import("@prisma/client").NotificationType> = {
        PAID: "PAYMENT_SUCCESS",
        FAILED: "PAYMENT_FAILED",
        REFUNDED: "PAYMENT_REFUNDED"
      };

      const notifType = typeMap[status];
      if (notifType && (payment.order.customerPhone || payment.order.customerName)) {
        const { notificationService } = await import("@/lib/notification-service");
        await notificationService.notify(
          notifType,
          channels,
          (channel) => channel === "EMAIL" ? null : (payment.order.customerPhone || null),
          {
            amount: Number(payment.amount),
            orderNumber: payment.order.orderNumber,
          },
          { type: "PAYMENT", id: payment.id }
        );
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update payment status", error);
    throw new Error("Failed to update payment status");
  }
}
