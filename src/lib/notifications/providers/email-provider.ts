import { INotificationProvider, SendNotificationOptions } from "../types";
import { Resend } from "resend";

export class EmailProvider implements INotificationProvider {
  name = "Resend";
  channel = "EMAIL" as const;
  private resend: Resend | null = null;
  private fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.NOTIFICATION_FROM_EMAIL || "noreply@cafe.com";
    
    if (apiKey && apiKey !== "placeholder") {
      this.resend = new Resend(apiKey);
    }
  }

  isConfigured(): boolean {
    return this.resend !== null;
  }

  async send(options: SendNotificationOptions) {
    if (!this.resend) {
      return { success: false, error: "Email provider is not configured" };
    }

    try {
      const response = await this.resend.emails.send({
        from: this.fromEmail,
        to: options.recipient,
        subject: options.subject || "Café Notification",
        text: options.message,
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      return { success: true, messageId: response.data?.id };
    } catch (e: unknown) {
      console.error("[EmailProvider] Error:", e);
      return { success: false, error: e instanceof Error ? e.message : "Unknown error sending email" };
    }
  }
}
