import Razorpay from "razorpay";
import crypto from "crypto";

export interface CreateOrderParams {
  amount: number; // In rupees
  currency: string;
  receipt: string;
}

export interface PaymentVerificationParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export class PaymentService {
  private razorpay: Razorpay;
  public readonly providerName = "RAZORPAY";

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.PAYMENT_PROVIDER_KEY_ID || "test_key",
      key_secret: process.env.PAYMENT_PROVIDER_KEY_SECRET || "test_secret",
    });
  }

  async createOrder({ amount, currency, receipt }: CreateOrderParams) {
    // Razorpay expects amount in paise (1 INR = 100 paise)
    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt,
    };

    const order = await this.razorpay.orders.create(options);
    return order;
  }

  verifyPayment({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  }: PaymentVerificationParams): boolean {
    const secret = process.env.PAYMENT_PROVIDER_KEY_SECRET || "test_secret";
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    return expectedSignature === razorpay_signature;
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    const secret = process.env.PAYMENT_PROVIDER_WEBHOOK_SECRET || "test_webhook_secret";
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    return expectedSignature === signature;
  }
}

export const paymentService = new PaymentService();
