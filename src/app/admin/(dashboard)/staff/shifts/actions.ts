"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, logActivity } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function startShift() {
  const admin = await requirePermission("STAFF_VIEW"); // Any staff who can view staff can start a shift, actually let's just let any active staff start a shift, so checking getting user is enough. 
  // Wait, the prompt says "Allow an authorized staff member to start their shift."
  
  try {
    // Check if already active
    const existing = await prisma.staffShift.findFirst({
      where: {
        userId: admin.id,
        status: "ACTIVE"
      }
    });

    if (existing) {
      throw new Error("You already have an active shift");
    }

    const shift = await prisma.staffShift.create({
      data: {
        userId: admin.id,
        status: "ACTIVE"
      }
    });

    await logActivity(admin.id, "SHIFT_STARTED", "StaffShift", shift.id, "Started shift");

    revalidatePath("/admin/staff/shifts");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to start shift:", error);
    return { error: error instanceof Error ? error.message : "Failed to start shift" };
  }
}

export async function endShift() {
  const admin = await requirePermission("STAFF_VIEW"); // Any logged-in staff

  try {
    const existing = await prisma.staffShift.findFirst({
      where: {
        userId: admin.id,
        status: "ACTIVE"
      }
    });

    if (!existing) {
      throw new Error("You do not have an active shift");
    }

    await prisma.staffShift.update({
      where: { id: existing.id },
      data: {
        status: "COMPLETED",
        endedAt: new Date()
      }
    });

    await logActivity(admin.id, "SHIFT_ENDED", "StaffShift", existing.id, "Ended shift");

    revalidatePath("/admin/staff/shifts");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to end shift:", error);
    return { error: error instanceof Error ? error.message : "Failed to end shift" };
  }
}
