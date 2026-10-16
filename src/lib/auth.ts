import { createClient } from "./supabase/server";
import { prisma } from "./prisma";

export async function getSession() {
  const supabase = await createClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function getAdminUser() {
  const user = await getSession();

  if (!user || !user.email) {
    return null;
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return null;
    }

    if (!dbUser.isActive) {
      return null; // Inactive staff cannot login
    }

    if (dbUser.role !== "OWNER" && dbUser.role !== "ADMIN" && dbUser.role !== "STAFF") {
      return null;
    }

    return dbUser;
  } catch (error) {
    console.error("Failed to verify admin user:", error);
    return null;
  }
}
