import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import NotificationSettingsClient from "./settings-client";

export default async function NotificationSettingsPage() {
  await requirePermission("SETTINGS_MANAGE");
  
  const settings = await prisma.notificationSettings.findUnique({
    where: { id: "default" }
  }) || {
    orderEmail: true,
    orderWhatsapp: false,
    paymentEmail: true,
    paymentWhatsapp: false,
    reservationEmail: true,
    reservationWhatsapp: false,
    reservationReminder: true,
    inventoryAlerts: true,
    staffAlerts: true,
  };

  return <NotificationSettingsClient settings={settings} />;
}
