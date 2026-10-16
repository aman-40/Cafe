import { NextResponse } from "next/server";
import { sendReservationReminders } from "@/lib/notifications/cron";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // A simple auth mechanism should be used in production (e.g. verifying a CRON_SECRET)
  // For the sake of this phase, we allow the GET request to trigger it.
  
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const sentCount = await sendReservationReminders();
    return NextResponse.json({ success: true, remindersQueued: sentCount });
  } catch (error: unknown) {
    console.error("Cron Error", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}
