import { prisma } from "@/lib/prisma";
import { notificationService } from "./service";

export async function sendReservationReminders() {
  const settings = await prisma.notificationSettings.findFirst() || { reservationReminder: true, reservationEmail: true, reservationWhatsapp: false };
  if (!settings.reservationReminder) return;

  const channels: import("@prisma/client").NotificationChannel[] = [];
  if (settings.reservationEmail) channels.push("EMAIL");
  if (settings.reservationWhatsapp) channels.push("WHATSAPP");

  if (channels.length === 0) return;

  // Find confirmed reservations for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const reservations = await prisma.reservation.findMany({
    where: {
      status: "CONFIRMED",
      reservationDate: {
        gte: new Date(`${tomorrowStr}T00:00:00.000Z`),
        lt: new Date(`${tomorrowStr}T23:59:59.999Z`)
      }
    }
  });

  let count = 0;
  for (const res of reservations) {
    // Check idempotency (have we sent a reminder already?)
    const existing = await prisma.notification.findFirst({
      where: {
        type: "RESERVATION_REMINDER",
        referenceType: "RESERVATION",
        referenceId: res.id,
        status: { in: ["PENDING", "PROCESSING", "SENT"] }
      }
    });

    if (existing) continue; // Already sent/queued

    await notificationService.notify(
      "RESERVATION_REMINDER",
      channels,
      (channel) => channel === "EMAIL" ? (res.customerEmail || null) : res.customerPhone,
      {
        customerName: res.customerName,
        reservationNumber: res.reservationNumber,
        date: res.reservationDate.toISOString().split("T")[0],
        time: res.startTime,
        guests: res.guestCount,
      },
      { type: "RESERVATION", id: res.id }
    );
    count++;
  }

  return count;
}
