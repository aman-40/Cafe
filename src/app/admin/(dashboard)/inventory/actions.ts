"use server";

import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { requirePermission, logActivity } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { TransactionType, UnitType } from "@prisma/client";

export async function createInventoryItem(data: {
  name: string;
  sku?: string;
  unit: UnitType;
  minimumStock: number;
  costPerUnit: number;
  isActive: boolean;
  initialStock: number;
}) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  try {
    const item = await prisma.$transaction(async (tx) => {
      const newItem = await tx.inventoryItem.create({
        data: {
          name: data.name,
          sku: data.sku || null,
          unit: data.unit,
          currentStock: data.initialStock,
          minimumStock: data.minimumStock,
          costPerUnit: data.costPerUnit,
          isActive: data.isActive,
        },
      });

      if (data.initialStock > 0) {
        await tx.inventoryTransaction.create({
          data: {
            inventoryItemId: newItem.id,
            type: TransactionType.INITIAL_STOCK,
            quantity: data.initialStock,
            previousStock: 0,
            newStock: data.initialStock,
            reason: "Initial stock setup",
            createdBy: admin.id,
          },
        });
      }
      return newItem;
    });

    revalidatePath("/admin/inventory");
    return { success: true, id: item.id };
  } catch (error) {
    console.error("Failed to create inventory item", error);
    return { error: "Failed to create inventory item" };
  }
}

export async function updateInventoryItem(id: string, data: {
  name: string;
  sku?: string;
  unit: UnitType;
  minimumStock: number;
  costPerUnit: number;
  isActive: boolean;
}) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  try {
    await prisma.inventoryItem.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku || null,
        unit: data.unit,
        minimumStock: data.minimumStock,
        costPerUnit: data.costPerUnit,
        isActive: data.isActive,
      },
    });

    revalidatePath("/admin/inventory");
    return { success: true };
  } catch (error) {
    console.error("Failed to update inventory item", error);
    return { error: "Failed to update inventory item" };
  }
}

export async function adjustInventory(id: string, data: {
  type: TransactionType;
  quantity: number; // positive means addition, negative means subtraction
  reason: string;
}) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  try {
    await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id },
      });

      if (!item) throw new Error("Item not found");

      const previousStock = Number(item.currentStock);
      const newStock = previousStock + data.quantity;

      // Ensure we don't go negative unintentionally, but since business rules may vary,
      // we'll explicitly prevent negative stock unless it's a specific override (which we don't have yet).
      if (newStock < 0) {
        throw new Error("Cannot adjust stock below zero.");
      }

      await tx.inventoryItem.update({
        where: { id },
        data: { currentStock: newStock },
      });

      await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: id,
          type: data.type,
          quantity: data.quantity,
          previousStock,
          newStock,
          reason: data.reason,
          createdBy: admin.id,
        },
      });
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/inventory/history");
    return { success: true };
  } catch (error) {
    console.error("Failed to adjust inventory", error);
    return { error: (error as Error).message || "Failed to adjust inventory" };
  }
}
