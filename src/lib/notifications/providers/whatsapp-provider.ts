import { INotificationProvider, SendNotificationOptions } from "../types";
import twilio from "twilio";

export class WhatsAppProvider implements INotificationProvider {
  name = "Twilio WhatsApp";
  channel = "WHATSAPP" as const;
  private client: twilio.Twilio | null = null;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.WHATSAPP_ACCOUNT_ID;
    const authToken = process.env.WHATSAPP_API_KEY;
    this.fromNumber = process.env.WHATSAPP_FROM_NUMBER || "";

    if (accountSid && authToken && accountSid !== "placeholder" && authToken !== "placeholder") {
      this.client = twilio(accountSid, authToken);
    }
  }

  isConfigured(): boolean {
    return this.client !== null && this.fromNumber !== "";
  }

  async send(options: SendNotificationOptions) {
    if (!this.client) {
      return { success: false, error: "WhatsApp provider is not configured" };
    }

    try {
      // Ensure recipient number is formatted properly for WhatsApp/Twilio (e.g. whatsapp:+919876543210)
      let to = options.recipient;
      if (!to.startsWith("whatsapp:")) {
        to = `whatsapp:${to.startsWith("+") ? to : `+${to}`}`;
      }

      let from = this.fromNumber;
      if (!from.startsWith("whatsapp:")) {
        from = `whatsapp:${from}`;
      }

      const message = await this.client.messages.create({
        body: options.message,
        from,
        to,
      });

      return { success: true, messageId: message.sid };
    } catch (e: unknown) {
      console.error("[WhatsAppProvider] Error:", e);
      return { success: false, error: e instanceof Error ? e.message : "Unknown error sending WhatsApp message" };
    }
  }
}
