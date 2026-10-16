"use server";

import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { requirePermission, logActivity } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function createCategory(formData: FormData) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const displayOrder = parseInt(formData.get("displayOrder") as string) || 0;
  const isActive = formData.get("isActive") === "true";

  if (!name) return { error: "Name is required" };

  try {
    await prisma.menuCategory.create({
      data: { name, description, displayOrder, isActive },
    });
    revalidatePath("/admin/menu/categories");
    revalidatePath("/menu");
    return { success: true };
  } catch (error) {
    return { error: "Failed to create category" };
  }
}

export async function updateCategory(id: string, formData: FormData) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const displayOrder = parseInt(formData.get("displayOrder") as string) || 0;
  const isActive = formData.get("isActive") === "true";

  if (!name) return { error: "Name is required" };

  try {
    await prisma.menuCategory.update({
      where: { id },
      data: { name, description, displayOrder, isActive },
    });
    revalidatePath("/admin/menu/categories");
    revalidatePath("/menu");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update category" };
  }
}

export async function toggleCategoryStatus(id: string, currentStatus: boolean) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  try {
    await prisma.menuCategory.update({
      where: { id },
      data: { isActive: !currentStatus },
    });
    revalidatePath("/admin/menu/categories");
    revalidatePath("/menu");
    return { success: true };
  } catch (error) {
    return { error: "Failed to toggle status" };
  }
}

export async function deleteCategory(id: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  try {
    const itemCount = await prisma.menuItem.count({ where: { categoryId: id } });
    if (itemCount > 0) {
      return { error: "Cannot delete category containing menu items" };
    }

    await prisma.menuCategory.delete({ where: { id } });
    revalidatePath("/admin/menu/categories");
    revalidatePath("/menu");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete category" };
  }
}
