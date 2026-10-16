import { getAdminUser } from "./auth";
import { prisma } from "./prisma";
import { User, Role } from "@prisma/client";
import { Permission, PERMISSIONS } from "./permissions-constants";

export { PERMISSIONS };
export type { Permission };

export function hasPermission(user: User, permission: Permission): boolean {
  if (!user.isActive) return false;
  if (user.role === "OWNER") return true;
  
  if (user.role === "ADMIN") {
    // Admins have access to everything except STAFF_MANAGE and SETTINGS_MANAGE by default, 
    // unless explicitly granted, or we can just say ADMIN has all operational permissions.
    const adminRestricted: Permission[] = ["STAFF_MANAGE", "SETTINGS_MANAGE"];
    if (adminRestricted.includes(permission)) {
      return user.permissions.includes(permission);
    }
    return true;
  }

  // For STAFF role, check explicit permissions
  return user.permissions.includes(permission);
}

export async function requirePermission(permission: Permission) {
  const user = await getAdminUser();
  if (!user) {
    throw new Error("Unauthorized: Not logged in");
  }
  
  if (!hasPermission(user, permission)) {
    throw new Error(`Forbidden: Missing permission ${permission}`);
  }
  
  return user;
}

export async function logActivity(userId: string, action: string, entityType?: string, entityId?: string, details?: string) {
  try {
    await prisma.staffActivity.create({
      data: { userId, action, entityType, entityId, details }
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
