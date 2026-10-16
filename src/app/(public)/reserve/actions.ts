"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notificationService } from "@/lib/notification-service";

export type CheckAvailabilityInput = {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  guests: number;
};

// Assuming default duration of 90 minutes
const RESERVATION_DURATION_MINS = 90;

export async function checkAvailability(input: CheckAvailabilityInput) {
  try {
    const requestedDate = new Date(input.date);
    requestedDate.setHours(0, 0, 0, 0);

    const [hours, minutes] = input.time.split(":").map(Number);
    const requestedStart = new Date(requestedDate);
    requestedStart.setHours(hours, minutes, 0, 0);

    const requestedEnd = new Date(requestedStart.getTime() + RESERVATION_DURATION_MINS * 60000);

    // Fetch all active tables
    const tables = await prisma.cafeTable.findMany({
      where: { isActive: true },
      orderBy: { capacity: 'asc' }
    });

    // Find conflicting reservations on that date
    const conflicts = await prisma.reservation.findMany({
      where: {
        reservationDate: requestedDate,
        status: { in: ["PENDING", "CONFIRMED", "SEATED"] }
      }
    });

    const conflictTableIds = new Set<string>();

    for (const res of conflicts) {
      const [resHours, resMins] = res.startTime.split(":").map(Number);
      const resStart = new Date(requestedDate);
      resStart.setHours(resHours, resMins, 0, 0);

      const [resEndHours, resEndMins] = res.endTime.split(":").map(Number);
      const resEnd = new Date(requestedDate);
      resEnd.setHours(resEndHours, resEndMins, 0, 0);

      // Check overlap
      if (requestedStart < resEnd && requestedEnd > resStart) {
        conflictTableIds.add(res.tableId);
      }
    }

    const availableTables = tables.filter(t => !conflictTableIds.has(t.id) && t.capacity >= input.guests);

    if (availableTables.length === 0) {
      return { error: `No suitable table is available for ${input.guests} guests at that time.` };
    }

    // Return the best fit (smallest capacity >= guests)
    const bestFit = availableTables[0];
    
    return { success: true, table: bestFit };

  } catch (error) {
    console.error("Availability check error", error);
    return { error: "Failed to check availability." };
  }
}

export async function createReservation(input: CheckAvailabilityInput & { 
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  specialRequest?: string;
}) {
  try {
    const requestedDate = new Date(input.date);
    requestedDate.setHours(0, 0, 0, 0);

    const [hours, minutes] = input.time.split(":").map(Number);
    const requestedStart = new Date(requestedDate);
    requestedStart.setHours(hours, minutes, 0, 0);

    const requestedEnd = new Date(requestedStart.getTime() + RESERVATION_DURATION_MINS * 60000);
    const endTimeString = `${requestedEnd.getHours().toString().padStart(2, '0')}:${requestedEnd.getMinutes().toString().padStart(2, '0')}`;

    const res = await prisma.$transaction(async (tx) => {
      // Find conflicting reservations on that date again within lock/transaction context
      const conflicts = await tx.reservation.findMany({
        where: {
          reservationDate: requestedDate,
          status: { in: ["PENDING", "CONFIRMED", "SEATED"] }
        }
      });

      const conflictTableIds = new Set<string>();
      for (const r of conflicts) {
        const [resHours, resMins] = r.startTime.split(":").map(Number);
        const resStart = new Date(requestedDate);
        resStart.setHours(resHours, resMins, 0, 0);

        const [resEndHours, resEndMins] = r.endTime.split(":").map(Number);
        const resEnd = new Date(requestedDate);
        resEnd.setHours(resEndHours, resEndMins, 0, 0);

        if (requestedStart < resEnd && requestedEnd > resStart) {
          conflictTableIds.add(r.tableId);
        }
      }

      const tables = await tx.cafeTable.findMany({
        where: { isActive: true },
        orderBy: { capacity: 'asc' }
      });

      const availableTables = tables.filter(t => !conflictTableIds.has(t.id) && t.capacity >= input.guests);

      if (availableTables.length === 0) {
        throw new Error(`That table is no longer available. Please choose another time.`);
      }

      const bestFit = availableTables[0];
      
      const resCount = await tx.reservation.count();
      const reservationNumber = `RES-${1000 + resCount + 1}`;

      const reservation = await tx.reservation.create({
        data: {
          reservationNumber,
          tableId: bestFit.id,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail || null,
          guestCount: input.guests,
          reservationDate: requestedDate,
          startTime: input.time,
          endTime: endTimeString,
          status: "PENDING",
          specialRequest: input.specialRequest || null
        },
        include: { table: true }
      });

      return reservation;
    });

    revalidatePath("/admin/reservations");
    
    // Fetch notification settings
    const settings = await prisma.notificationSettings.findFirst() || { 
      reservationEmail: true, 
      reservationWhatsapp: false, 
      staffAlerts: true 
    };
    const channels: import("@prisma/client").NotificationChannel[] = [];
    if (settings.reservationEmail) channels.push("EMAIL");
    if (settings.reservationWhatsapp) channels.push("WHATSAPP");

    // Notify
    if (channels.length > 0) {
      await notificationService.notify(
        "RESERVATION_CREATED",
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
    }

    // Notify Staff
    if (settings.staffAlerts) {
      const managers = await prisma.user.findMany({
        where: { isActive: true, OR: [{ role: "OWNER" }, { permissions: { has: "RESERVATIONS_MANAGE" } }] }
      });
      
      for (const manager of managers) {
        await notificationService.notify(
          "RESERVATION_CREATED",
          ["EMAIL"],
          () => manager.email,
          {
            customerName: res.customerName,
            reservationNumber: res.reservationNumber,
            date: res.reservationDate.toISOString().split("T")[0],
            time: res.startTime,
            guests: res.guestCount,
          },
          { type: "RESERVATION_STAFF_ALERT", id: `${res.id}-${manager.id}` }
        );
      }
    }

    return { success: true, reservationNumber: res.reservationNumber };

  } catch (error: unknown) {
    console.error("Reservation creation error", error);
    return { error: (error as Error).message || "Failed to create reservation." };
  }
}
