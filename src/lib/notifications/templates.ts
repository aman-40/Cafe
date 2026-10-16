import { NotificationType } from "@prisma/client";

export function getNotificationTemplate(type: NotificationType, data: Record<string, unknown>): { subject?: string; message: string } {
  switch (type) {
    case "ORDER_CREATED":
      return {
        subject: `Order #${data.orderNumber} Received`,
        message: `Hi ${data.customerName || 'there'},\n\nWe have received your order #${data.orderNumber}!\n\nTable: ${data.tableNumber || 'N/A'}\nTotal: ₹${data.total}\nPayment Method: ${data.paymentMethod || 'N/A'}\n\nWe'll let you know when it's ready.`,
      };
    
    case "ORDER_CONFIRMED":
      return {
        subject: `Order #${data.orderNumber} Confirmed`,
        message: `Great news! Your order #${data.orderNumber} has been confirmed and we're starting to work on it.`
      };

    case "ORDER_PREPARING":
      return {
        subject: `Order #${data.orderNumber} Preparing`,
        message: `Your order #${data.orderNumber} is now being prepared by our kitchen.`
      };

    case "ORDER_READY":
      return {
        subject: `Order #${data.orderNumber} is Ready!`,
        message: `Good news! Your order #${data.orderNumber} is ready for you.`
      };

    case "ORDER_COMPLETED":
      return {
        subject: `Order #${data.orderNumber} Completed`,
        message: `Thank you for dining with us. We hope you enjoyed your order #${data.orderNumber}!`
      };

    case "PAYMENT_SUCCESS":
      return {
        subject: `Payment Successful for Order #${data.orderNumber}`,
        message: `We have received your payment of ₹${data.amount} for order #${data.orderNumber}.\n\nThank you!`
      };
    
    case "PAYMENT_FAILED":
      return {
        subject: `Payment Failed for Order #${data.orderNumber}`,
        message: `Unfortunately, the payment of ₹${data.amount} for order #${data.orderNumber} failed. Please try again or contact staff.`
      };

    case "PAYMENT_REFUNDED":
      return {
        subject: `Refund Processed for Order #${data.orderNumber}`,
        message: `A refund of ₹${data.amount} has been processed for order #${data.orderNumber}.`
      };

    case "RESERVATION_CREATED":
      return {
        subject: `Reservation Request Received (#${data.reservationNumber})`,
        message: `Hi ${data.customerName},\n\nWe've received your reservation request (#${data.reservationNumber}) for ${data.date} at ${data.time} for ${data.guests} guests.\n\nWe'll review it and send you a confirmation shortly.`
      };
    
    case "RESERVATION_CONFIRMED":
      return {
        subject: `Reservation Confirmed! (#${data.reservationNumber})`,
        message: `Hi ${data.customerName},\n\nYour reservation (#${data.reservationNumber}) is CONFIRMED for ${data.date} at ${data.time} for ${data.guests} guests.\n\nWe look forward to hosting you!`
      };

    case "RESERVATION_REJECTED":
      return {
        subject: `Reservation Update (#${data.reservationNumber})`,
        message: `Hi ${data.customerName},\n\nUnfortunately, we are unable to accommodate your reservation (#${data.reservationNumber}) for ${data.date} at ${data.time}.\n\n${data.reason || 'We are fully booked at this time. We apologize for the inconvenience.'}`
      };

    case "RESERVATION_CANCELLED":
      return {
        subject: `Reservation Cancelled (#${data.reservationNumber})`,
        message: `Hi ${data.customerName},\n\nYour reservation (#${data.reservationNumber}) for ${data.date} at ${data.time} has been cancelled.\n\nWe hope to see you another time.`
      };

    case "RESERVATION_REMINDER":
      return {
        subject: `Reminder: Your Reservation Tomorrow (#${data.reservationNumber})`,
        message: `Hi ${data.customerName},\n\nThis is a friendly reminder for your reservation (#${data.reservationNumber}) tomorrow, ${data.date} at ${data.time} for ${data.guests} guests.\n\nSee you soon!`
      };
    
    case "LOW_STOCK_ALERT":
      return {
        subject: `Low Stock Alert: ${data.itemName}`,
        message: `Inventory Alert:\n\nItem: ${data.itemName}\nCurrent Stock: ${data.currentStock} ${data.unit}\nMinimum Threshold: ${data.minimumStock} ${data.unit}\n\nPlease restock soon.`
      };

    case "OUT_OF_STOCK_ALERT":
      return {
        subject: `Out of Stock Alert: ${data.itemName}`,
        message: `CRITICAL Inventory Alert:\n\nItem: ${data.itemName} is out of stock (Current: ${data.currentStock} ${data.unit}).\n\nPlease restock immediately.`
      };

    default:
      return {
        subject: "Café Notification",
        message: `You have a new notification from the café.`
      };
  }
}
