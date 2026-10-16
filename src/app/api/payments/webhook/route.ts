import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentService } from "@/lib/payment-service";
import { PaymentStatus, OrderStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const isValid = paymentService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    // Idempotency: Ignore if we have processed this specific event or payment transition already, 
    // or just rely on idempotent status updates.
    
    // We only care about payment.captured or payment.failed
    if (event.event === "payment.captured") {
      const paymentEntity = event.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      
      const payment = await prisma.payment.findUnique({
        where: { providerOrderId: razorpayOrderId },
        include: { order: true },
      });

      if (!payment) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      if (payment.status === PaymentStatus.PAID) {
        // Already processed
        return NextResponse.json({ success: true, message: "Already processed" });
      }

      // Verify amount (Razorpay amount is in paise)
      const capturedAmount = Number(paymentEntity.amount) / 100;
      if (capturedAmount !== Number(payment.amount)) {
        return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            providerPaymentId: paymentEntity.id,
            method: paymentEntity.method,
          },
        }),
        // Also update order if it was PENDING
        prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: payment.order.status === OrderStatus.PENDING ? OrderStatus.CONFIRMED : payment.order.status,
          },
        }),
      ]);

      return NextResponse.json({ success: true });
    }

    if (event.event === "payment.failed") {
      const paymentEntity = event.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      
      const payment = await prisma.payment.findUnique({
        where: { providerOrderId: razorpayOrderId },
      });

      if (payment && payment.status !== PaymentStatus.PAID) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED },
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true, message: "Event ignored" });

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
