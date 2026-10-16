"use server";

import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { requirePermission, logActivity } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function createTable(formData: FormData) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const tableNumber = (formData.get("tableNumber") as string).trim();
  const capacity = parseInt(formData.get("capacity") as string) || 2;
  const isActive = formData.get("isActive") === "true";

  if (!tableNumber || capacity <= 0) {
    return { error: "Invalid table number or capacity" };
  }

  try {
    const existing = await prisma.cafeTable.findUnique({
      where: { tableNumber }
    });

    if (existing) {
      return { error: `Table ${tableNumber} already exists` };
    }

    // Generate a unique fallback QR code string, though we use the URL for actual QR code content
    const qrCode = `TABLE_${tableNumber}_${Date.now()}`;

    await prisma.cafeTable.create({
      data: { tableNumber, capacity, isActive, qrCode },
    });
    revalidatePath("/admin/tables");
    return { success: true };
  } catch (error) {
    return { error: "Failed to create table" };
  }
}

export async function updateTable(id: string, formData: FormData) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const tableNumber = (formData.get("tableNumber") as string).trim();
  const capacity = parseInt(formData.get("capacity") as string) || 2;
  const isActive = formData.get("isActive") === "true";

  if (!tableNumber || capacity <= 0) {
    return { error: "Invalid table number or capacity" };
  }

  try {
    const existing = await prisma.cafeTable.findFirst({
      where: { tableNumber, NOT: { id } }
    });

    if (existing) {
      return { error: `Table ${tableNumber} already exists` };
    }

    await prisma.cafeTable.update({
      where: { id },
      data: { tableNumber, capacity, isActive },
    });
    revalidatePath("/admin/tables");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update table" };
  }
}

export async function toggleTableStatus(id: string, currentStatus: boolean) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  try {
    await prisma.cafeTable.update({
      where: { id },
      data: { isActive: !currentStatus },
    });
    revalidatePath("/admin/tables");
    return { success: true };
  } catch (error) {
    return { error: "Failed to toggle table status" };
  }
}

export async function deleteTable(id: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  try {
    await prisma.cafeTable.delete({ where: { id } });
    revalidatePath("/admin/tables");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete table" };
  }
}
