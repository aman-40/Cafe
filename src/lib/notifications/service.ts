import { prisma } from "@/lib/prisma";
import { NotificationType, NotificationChannel, INotificationProvider } from "./types";
import { getNotificationTemplate } from "./templates";
import { EmailProvider } from "./providers/email-provider";
import { WhatsAppProvider } from "./providers/whatsapp-provider";
import { ConsoleProvider } from "./providers/console-provider";

export class NotificationService {
  private providers: Partial<Record<NotificationChannel, INotificationProvider[]>> = {};

  constructor() {
    this.initProviders();
  }

  private initProviders() {
    // Email providers
    const emailProvider = new EmailProvider();
    const consoleEmailProvider = new ConsoleProvider("EMAIL");
    this.providers.EMAIL = [
      emailProvider.isConfigured() ? emailProvider : consoleEmailProvider
    ];

    // WhatsApp providers
    const waProvider = new WhatsAppProvider();
    const consoleWaProvider = new ConsoleProvider("WHATSAPP");
    this.providers.WHATSAPP = [
      waProvider.isConfigured() ? waProvider : consoleWaProvider
    ];
  }

  /**
   * Queue a business notification event.
   * Doesn't block the caller transaction.
   */
  async notify(
    type: NotificationType,
    channels: NotificationChannel[],
    recipientResolver: (channel: NotificationChannel) => string | null,
    data: Record<string, unknown>,
    reference?: { type: string; id: string }
  ) {
    // Generate content
    const template = getNotificationTemplate(type, data);

    // Create DB records (in background, un-awaited)
    Promise.resolve().then(async () => {
      try {
        for (const channel of channels) {
          const recipient = recipientResolver(channel);
          if (!recipient) continue; // No contact info for this channel

          const notification = await prisma.notification.create({
            data: {
              type,
              channel,
              recipient,
              subject: template.subject,
              message: template.message,
              referenceType: reference?.type,
              referenceId: reference?.id,
              status: "PENDING",
            }
          });

          // Kick off processing (asynchronous)
          this.processNotification(notification.id).catch(console.error);
        }
      } catch (err) {
        console.error("[NotificationService] Failed to queue notification", err);
      }
    });
  }

  private async processNotification(id: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return;
    if (notification.status !== "PENDING" && notification.status !== "FAILED") return;
    if (notification.attempts >= 3) return; // Max attempts

    await prisma.notification.update({
      where: { id },
      data: { status: "PROCESSING", lastAttemptAt: new Date(), attempts: { increment: 1 } }
    });

    const channelProviders = this.providers[notification.channel];
    if (!channelProviders || channelProviders.length === 0) {
      await prisma.notification.update({
        where: { id },
        data: { status: "FAILED", errorMessage: "No provider configured for channel" }
      });
      return;
    }

    // Try first available provider
    const provider = channelProviders[0];
    
    try {
      const result = await provider.send({
        type: notification.type,
        recipient: notification.recipient,
        subject: notification.subject || undefined,
        message: notification.message,
        referenceType: notification.referenceType || undefined,
        referenceId: notification.referenceId || undefined,
      });

      if (result.success) {
        await prisma.notification.update({
          where: { id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            provider: provider.name,
            providerMessageId: result.messageId
          }
        });
      } else {
        await prisma.notification.update({
          where: { id },
          data: {
            status: notification.attempts + 1 >= 3 ? "FAILED" : "PENDING",
            errorMessage: result.error,
            provider: provider.name
          }
        });
      }
    } catch (e: unknown) {
      await prisma.notification.update({
        where: { id },
        data: {
          status: notification.attempts + 1 >= 3 ? "FAILED" : "PENDING",
          errorMessage: e instanceof Error ? e.message : "Unknown error",
          provider: provider.name
        }
      });
    }
  }

  // Idempotent alert trigger (e.g. for Low Stock)
  async notifyIdempotent(
    type: NotificationType,
    channels: NotificationChannel[],
    recipientResolver: (channel: NotificationChannel) => string | null,
    data: Record<string, unknown>,
    reference: { type: string; id: string }
  ) {
    // Check if an active/recent notification already exists
    // for this exact type and reference
    const recent = await prisma.notification.findFirst({
      where: {
        type,
        referenceType: reference.type,
        referenceId: reference.id,
        status: { in: ["PENDING", "PROCESSING", "SENT"] },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
        }
      }
    });

    if (recent) {
      // Avoid duplicate alert
      return;
    }

    await this.notify(type, channels, recipientResolver, data, reference);
  }
}

export const notificationService = new NotificationService();
