"use server";

import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function addIngredient(menuItemId: string, inventoryItemId: string, quantity: number) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  try {
    if (quantity <= 0) throw new Error("Quantity must be positive");

    await prisma.menuItemIngredient.create({
      data: {
        menuItemId,
        inventoryItemId,
        quantity,
      }
    });

    revalidatePath(`/admin/menu/items/${menuItemId}/edit`);
    return { success: true };
  } catch (error) {
    console.error("Failed to add ingredient", error);
    const err = error as Error & { code?: string };
    if (err.code === 'P2002') return { error: "Ingredient already added to this recipe." };
    return { error: err.message || "Failed to add ingredient" };
  }
}

export async function removeIngredient(id: string, menuItemId: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  try {
    await prisma.menuItemIngredient.delete({
      where: { id }
    });

    revalidatePath(`/admin/menu/items/${menuItemId}/edit`);
    return { success: true };
  } catch (error) {
    console.error("Failed to remove ingredient", error);
    return { error: "Failed to remove ingredient" };
  }
}
