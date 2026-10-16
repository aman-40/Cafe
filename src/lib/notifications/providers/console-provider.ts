import { INotificationProvider, SendNotificationOptions } from "../types";

export class ConsoleProvider implements INotificationProvider {
  name = "Console";
  channel: "EMAIL" | "WHATSAPP" = "EMAIL"; // Default to email type for console

  constructor(channel: "EMAIL" | "WHATSAPP") {
    this.channel = channel;
  }

  isConfigured(): boolean {
    return true; // Console is always "configured"
  }

  async send(options: SendNotificationOptions) {
    console.log(`\n=== [${this.name} ${this.channel}] NOTIFICATION ===`);
    console.log(`Type: ${options.type}`);
    console.log(`To: ${options.recipient}`);
    if (options.subject) console.log(`Subject: ${options.subject}`);
    console.log(`Message:\n${options.message}`);
    console.log(`===========================================\n`);
    
    return { success: true, messageId: `console-${Date.now()}` };
  }
}
