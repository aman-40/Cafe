/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { requirePermission, logActivity } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function uploadImage(file: File, itemId: string): Promise<string | null> {
  if (!file || file.size === 0) return null;
  
  const supabase = await createClient();
  const fileExt = file.name.split('.').pop();
  const filePath = `menu-items/${itemId}/${Date.now()}.${fileExt}`;
  
  // Validate mime type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }
  
  const { error } = await supabase.storage
    .from('menu-images')
    .upload(filePath, file);
    
  if (error) {
    console.error("Upload error:", error);
    throw new Error('Failed to upload image');
  }
  
  const { data } = supabase.storage
    .from('menu-images')
    .getPublicUrl(filePath);
    
  return data.publicUrl;
}

export async function createItem(formData: FormData) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const categoryId = formData.get("categoryId") as string;
  const displayOrder = parseInt(formData.get("displayOrder") as string) || 0;
  const isAvailable = formData.get("isAvailable") === "true";
  const isFeatured = formData.get("isFeatured") === "true";
  const imageFile = formData.get("image") as File | null;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

  if (!name || !categoryId || isNaN(price) || price < 0) {
    return { error: "Invalid input fields" };
  }

  try {
    const item = await prisma.menuItem.create({
      data: {
        name,
        slug,
        description,
        price,
        categoryId,
        displayOrder,
        isAvailable,
        isFeatured,
      },
    });

    if (imageFile && imageFile.size > 0) {
      try {
        const imageUrl = await uploadImage(imageFile, item.id);
        if (imageUrl) {
          await prisma.menuItem.update({
            where: { id: item.id },
            data: { image: imageUrl }
          });
        }
      } catch (uploadError: any) {
        // If image upload fails, keep the item but return a warning
        return { success: true, warning: uploadError.message };
      }
    }

    revalidatePath("/admin/menu/items");
    revalidatePath("/menu");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Failed to create menu item" };
  }
}

export async function updateItem(id: string, formData: FormData) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const categoryId = formData.get("categoryId") as string;
  const displayOrder = parseInt(formData.get("displayOrder") as string) || 0;
  const isAvailable = formData.get("isAvailable") === "true";
  const isFeatured = formData.get("isFeatured") === "true";
  const imageFile = formData.get("image") as File | null;
  const removeImage = formData.get("removeImage") === "true";

  if (!name || !categoryId || isNaN(price) || price < 0) {
    return { error: "Invalid input fields" };
  }

  try {
    let imageUrl: string | undefined | null = undefined;

    if (removeImage) {
      imageUrl = null;
    } else if (imageFile && imageFile.size > 0) {
      const uploadedUrl = await uploadImage(imageFile, id);
      if (uploadedUrl) imageUrl = uploadedUrl;
    }

    await prisma.menuItem.update({
      where: { id },
      data: {
        name,
        description,
        price,
        categoryId,
        displayOrder,
        isAvailable,
        isFeatured,
        ...(imageUrl !== undefined && { image: imageUrl })
      },
    });

    revalidatePath("/admin/menu/items");
    revalidatePath("/menu");
    revalidatePath(`/menu/item/${id}`);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update menu item" };
  }
}

export async function toggleItemStatus(id: string, field: "isAvailable" | "isFeatured", currentValue: boolean) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  try {
    await prisma.menuItem.update({
      where: { id },
      data: { [field]: !currentValue },
    });
    revalidatePath("/admin/menu/items");
    revalidatePath("/menu");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: `Failed to toggle ${field}` };
  }
}

export async function deleteItem(id: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  try {
    await prisma.menuItem.delete({ where: { id } });
    revalidatePath("/admin/menu/items");
    revalidatePath("/menu");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete menu item" };
  }
}
