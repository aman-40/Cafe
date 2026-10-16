"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, logActivity } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

export async function createStaff(data: {
  name: string;
  email: string;
  role: Role;
  position: string;
  permissions: string[];
}) {
  const admin = await requirePermission("STAFF_MANAGE");

  try {
    // Validate email
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new Error("Email already in use");
    }

    // Protection: only OWNER can create another OWNER or ADMIN
    if (data.role === 'OWNER' && admin.role !== 'OWNER') {
      throw new Error("Only an OWNER can create another OWNER");
    }
    if (data.role === 'ADMIN' && admin.role !== 'OWNER') {
      throw new Error("Only an OWNER can create an ADMIN");
    }

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        position: data.position,
        permissions: data.role === 'STAFF' ? data.permissions : [],
        isActive: true
      }
    });

    await logActivity(admin.id, "STAFF_CREATED", "User", newUser.id, `Created ${data.role} ${data.name}`);

    revalidatePath("/admin/staff");
    return { success: true, id: newUser.id };
  } catch (error: unknown) {
    console.error("Failed to create staff:", error);
    return { error: error instanceof Error ? error.message : "Failed to create staff member" };
  }
}

export async function updateStaff(id: string, data: {
  name: string;
  role: Role;
  position: string;
  permissions: string[];
}) {
  const admin = await requirePermission("STAFF_MANAGE");

  try {
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) throw new Error("Staff member not found");

    // Protection: Normal ADMIN cannot modify OWNER
    if (targetUser.role === 'OWNER' && admin.role !== 'OWNER') {
      throw new Error("Only an OWNER can modify another OWNER");
    }
    
    // Protection: Cannot elevate to OWNER unless currently an OWNER
    if (data.role === 'OWNER' && admin.role !== 'OWNER') {
      throw new Error("Only an OWNER can promote someone to OWNER");
    }

    // Protection: Cannot elevate to ADMIN unless currently an OWNER
    if (data.role === 'ADMIN' && admin.role !== 'OWNER' && targetUser.role !== 'ADMIN') {
      throw new Error("Only an OWNER can promote someone to ADMIN");
    }

    await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        role: data.role,
        position: data.position,
        permissions: data.role === 'STAFF' ? data.permissions : []
      }
    });

    await logActivity(admin.id, "STAFF_UPDATED", "User", id, `Updated staff ${data.name}`);

    revalidatePath("/admin/staff");
    revalidatePath(`/admin/staff/${id}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to update staff:", error);
    return { error: error instanceof Error ? error.message : "Failed to update staff member" };
  }
}

export async function toggleStaffStatus(id: string, isActive: boolean) {
  const admin = await requirePermission("STAFF_MANAGE");

  try {
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) throw new Error("Staff member not found");

    if (id === admin.id) {
      throw new Error("You cannot deactivate your own account");
    }

    if (targetUser.role === 'OWNER' && admin.role !== 'OWNER') {
      throw new Error("Only an OWNER can deactivate another OWNER");
    }

    if (!isActive && targetUser.role === 'OWNER') {
      // Prevent deleting the final owner
      const activeOwners = await prisma.user.count({
        where: { role: 'OWNER', isActive: true }
      });
      if (activeOwners <= 1) {
        throw new Error("Cannot deactivate the final active OWNER account");
      }
    }

    await prisma.user.update({
      where: { id },
      data: { isActive }
    });

    await logActivity(
      admin.id, 
      isActive ? "STAFF_ACTIVATED" : "STAFF_DEACTIVATED", 
      "User", 
      id, 
      `${isActive ? 'Activated' : 'Deactivated'} staff ${targetUser.name}`
    );

    revalidatePath("/admin/staff");
    revalidatePath(`/admin/staff/${id}`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to toggle staff status:", error);
    return { error: error instanceof Error ? error.message : "Failed to change staff status" };
  }
}
