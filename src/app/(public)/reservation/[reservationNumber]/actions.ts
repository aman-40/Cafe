"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function cancelReservation(reservationNumber: string) {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { reservationNumber }
    });

    if (!reservation) {
      return { error: "Reservation not found." };
    }

    if (reservation.status !== "PENDING" && reservation.status !== "CONFIRMED") {
      return { error: "This reservation can no longer be cancelled online. Please contact the café." };
    }

    // Check cancellation window (e.g. 1 hour before)
    const [hours, minutes] = reservation.startTime.split(":").map(Number);
    const resDate = new Date(reservation.reservationDate);
    resDate.setHours(hours, minutes, 0, 0);

    const oneHourBefore = new Date(resDate.getTime() - 60 * 60000);
    if (new Date() > oneHourBefore) {
      return { error: "Reservations can only be cancelled up to 1 hour before the time. Please contact the café." };
    }

    await prisma.reservation.update({
      where: { reservationNumber },
      data: { status: "CANCELLED" }
    });

    revalidatePath(`/reservation/${reservationNumber}`);
    revalidatePath(`/admin/reservations`);

    return { success: true };
  } catch (error) {
    console.error("Cancel reservation error", error);
    return { error: "Failed to cancel reservation." };
  }
}
