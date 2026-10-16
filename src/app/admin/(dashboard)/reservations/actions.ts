"use server";

import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { requirePermission, logActivity } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { notificationService } from "@/lib/notification-service";
import { ReservationStatus } from "@prisma/client";

export async function updateReservationStatus(id: string, status: ReservationStatus) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  try {
    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: { table: true }
    });

    revalidatePath("/admin/reservations");
    revalidatePath(`/reservation/${reservation.reservationNumber}`);

    // If status changed to something important, notify
    if (status === "CONFIRMED" || status === "CANCELLED" || status === "REJECTED") {
      const typeMap: Record<string, import("@prisma/client").NotificationType> = {
        CONFIRMED: "RESERVATION_CONFIRMED",
        CANCELLED: "RESERVATION_CANCELLED",
        REJECTED: "RESERVATION_REJECTED"
      };

      const settings = await prisma.notificationSettings.findFirst() || { reservationEmail: true, reservationWhatsapp: false };
      const channels: import("@prisma/client").NotificationChannel[] = [];
      if (settings.reservationEmail) channels.push("EMAIL");
      if (settings.reservationWhatsapp) channels.push("WHATSAPP");

      if (channels.length > 0) {
        await notificationService.notify(
          typeMap[status],
          channels,
          (channel) => channel === "EMAIL" ? (reservation.customerEmail || null) : reservation.customerPhone,
          {
            customerName: reservation.customerName,
            reservationNumber: reservation.reservationNumber,
            date: reservation.reservationDate.toISOString().split("T")[0],
            time: reservation.startTime,
            guests: reservation.guestCount,
          },
          { type: "RESERVATION", id: reservation.id }
        );
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Update reservation status error", error);
    return { error: "Failed to update status." };
  }
}
