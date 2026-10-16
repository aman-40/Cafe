"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function updateNotificationSettings(data: unknown) {
  await requirePermission("SETTINGS_MANAGE");
  try {
    const existing = await prisma.notificationSettings.findUnique({ where: { id: "default" } });
    if (existing) {
      await prisma.notificationSettings.update({
        where: { id: "default" },
        data: data as Record<string, boolean>
      });
    } else {
      await prisma.notificationSettings.create({
        data: { id: "default", ...(data as Record<string, boolean>) }
      });
    }
    revalidatePath("/admin/settings/notifications");
    return { success: true };
  } catch (error: unknown) {
    console.error("Update settings error", error);
    return { error: error instanceof Error ? error.message : "Failed to update notification settings." };
  }
}
