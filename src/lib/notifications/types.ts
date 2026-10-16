import { NotificationType, NotificationChannel, NotificationStatus } from "@prisma/client";

export type { NotificationType, NotificationChannel, NotificationStatus };

export interface SendNotificationOptions {
  type: NotificationType;
  recipient: string; // email address or phone number
  subject?: string;
  message: string;
  referenceType?: string;
  referenceId?: string;
}

export interface INotificationProvider {
  name: string;
  channel: NotificationChannel;
  isConfigured(): boolean;
  send(options: SendNotificationOptions): Promise<{ success: boolean; messageId?: string; error?: string }>;
}
