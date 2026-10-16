"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateNotificationSettings } from "./actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function NotificationSettingsClient({ settings }: { settings: Record<string, any> }) {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setMessage("");
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      orderEmail: formData.get("orderEmail") === "on",
      orderWhatsapp: formData.get("orderWhatsapp") === "on",
      paymentEmail: formData.get("paymentEmail") === "on",
      paymentWhatsapp: formData.get("paymentWhatsapp") === "on",
      reservationEmail: formData.get("reservationEmail") === "on",
      reservationWhatsapp: formData.get("reservationWhatsapp") === "on",
      reservationReminder: formData.get("reservationReminder") === "on",
      inventoryAlerts: formData.get("inventoryAlerts") === "on",
      staffAlerts: formData.get("staffAlerts") === "on",
    };

    const res = await updateNotificationSettings(data);
    setIsPending(false);
    if (res.error) {
      setError(res.error);
    } else {
      setMessage("Settings updated successfully.");
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>
      
      {error && <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-md">{error}</div>}
      {message && <div className="p-3 mb-4 bg-green-50 text-green-600 rounded-md">{message}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 border rounded-lg shadow-sm space-y-4">
          <h2 className="font-semibold text-lg border-b pb-2">Customer Order Notifications</h2>
          <div className="flex gap-4">
            <Label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="orderEmail" defaultChecked={settings.orderEmail} className="w-4 h-4 rounded text-primary" />
              Email
            </Label>
            <Label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="orderWhatsapp" defaultChecked={settings.orderWhatsapp} className="w-4 h-4 rounded text-primary" />
              WhatsApp
            </Label>
          </div>

          <h2 className="font-semibold text-lg border-b pb-2 pt-4">Customer Payment Notifications</h2>
          <div className="flex gap-4">
            <Label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="paymentEmail" defaultChecked={settings.paymentEmail} className="w-4 h-4 rounded text-primary" />
              Email
            </Label>
            <Label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="paymentWhatsapp" defaultChecked={settings.paymentWhatsapp} className="w-4 h-4 rounded text-primary" />
              WhatsApp
            </Label>
          </div>

          <h2 className="font-semibold text-lg border-b pb-2 pt-4">Customer Reservation Notifications</h2>
          <div className="flex gap-4">
            <Label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="reservationEmail" defaultChecked={settings.reservationEmail} className="w-4 h-4 rounded text-primary" />
              Email
            </Label>
            <Label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="reservationWhatsapp" defaultChecked={settings.reservationWhatsapp} className="w-4 h-4 rounded text-primary" />
              WhatsApp
            </Label>
          </div>
          <div className="pt-2">
            <Label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" name="reservationReminder" defaultChecked={settings.reservationReminder} className="w-4 h-4 rounded text-primary" />
              Send automatic 24-hour reminders
            </Label>
          </div>

          <h2 className="font-semibold text-lg border-b pb-2 pt-4">Internal Staff Notifications (Email)</h2>
          <div className="flex flex-col gap-3">
            <Label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="inventoryAlerts" defaultChecked={settings.inventoryAlerts} className="w-4 h-4 rounded text-primary" />
              Low Stock & Out of Stock Alerts
            </Label>
            <Label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="staffAlerts" defaultChecked={settings.staffAlerts} className="w-4 h-4 rounded text-primary" />
              New Reservation & Operational Alerts
            </Label>
          </div>
        </div>

        <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Settings"}</Button>
      </form>
    </div>
  );
}
