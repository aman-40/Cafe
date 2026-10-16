"use client";

import { useCartStore } from "@/lib/store/cart";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { createOrder } from "./actions";
import Script from "next/script";

export default function CheckoutPage() {
  const { items, tableNumber, getCartTotal, clearCart } = useCartStore();
  const router = useRouter();
  
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "CASH">("ONLINE");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const total = getCartTotal();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8">Add items from the menu to checkout.</p>
        <Link href="/menu" className={buttonVariants({ className: "w-full rounded-full" })}>
          Back to Menu
        </Link>
      </div>
    );
  }

  if (!tableNumber) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">No Table Selected</h1>
        <p className="text-muted-foreground mb-8">Please scan the QR code on your table to place an order.</p>
        <Link href="/menu" className={buttonVariants({ className: "w-full rounded-full" })}>
          View Menu
        </Link>
      </div>
    );
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const result = await createOrder({
        tableNumber: tableNumber as string,
        customerName,
        customerPhone,
        orderNotes,
        paymentMethod,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes,
        })),
      });

      if ('error' in result) {
        setError(result.error);
        setIsPending(false);
      } else if ('success' in result && result.orderNumber) {
        if (paymentMethod === "ONLINE" && 'rzpOrderId' in result && result.rzpOrderId) {
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "test_key", // We need to expose this safely or use a test key here for the frontend widget
            amount: result.total ? result.total * 100 : 0,
            currency: "INR",
            name: "The Premium Café",
            description: "Table Order",
            order_id: result.rzpOrderId,
            handler: function () {
              clearCart();
              router.push(`/order/${result.orderNumber}`);
            },
            prefill: {
              name: customerName,
              contact: customerPhone,
            },
            theme: { color: "#000000" },
          };
          // @ts-expect-error Razorpay is added via script tag
          const rzp1 = new window.Razorpay(options);
          rzp1.on('payment.failed', function () {
            setError("Payment failed. Please try again.");
            setIsPending(false);
          });
          rzp1.open();
        } else {
          clearCart();
          router.push(`/order/${result.orderNumber}`);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsPending(false);
    }
  }


  return (
    <div className="min-h-screen bg-background py-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6">
          <Link href="/menu" className={buttonVariants({ variant: "ghost", className: "-ml-4 hover:bg-transparent hover:text-primary" })}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Menu
          </Link>
        </div>

        <h1 className="text-3xl font-serif font-bold mb-8">Checkout</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex gap-3 items-start border border-red-100 mb-8">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7 space-y-8">
            {/* Order Summary */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="mb-4 text-sm font-medium text-green-600 bg-green-50 w-fit px-3 py-1 rounded-full border border-green-100">
                Table {tableNumber}
              </div>
              <ul className="space-y-4">
                {items.map(item => (
                  <li key={item.id} className="flex justify-between pb-4 border-b last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium">{item.quantity} × {item.name}</div>
                      {item.notes && <div className="text-xs text-muted-foreground mt-1">Note: {item.notes}</div>}
                    </div>
                    <div className="font-medium">
                      ₹{item.price * item.quantity}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-4 border-t flex justify-between items-center">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-2xl text-primary">₹{total}</span>
              </div>
            </div>

            {/* Customer Details */}
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h2 className="text-xl font-bold mb-4">Your Details (Optional)</h2>
              <p className="text-sm text-muted-foreground mb-4">Provide your name to help us serve you better.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="e.g. 9876543210" />
                </div>
              </div>
              
              <div className="space-y-2 pt-2">
                <Label htmlFor="orderNotes">Order Notes</Label>
                <Textarea 
                  id="orderNotes" 
                  value={orderNotes} 
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOrderNotes(e.target.value)} 
                  placeholder="Any special instructions for the whole order?"
                  className="resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-4 pt-4 border-t mt-6">
                <h3 className="font-bold">Payment Method</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => setPaymentMethod("ONLINE")}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-colors ${paymentMethod === "ONLINE" ? "border-primary bg-primary/5" : "border-gray-200"}`}
                  >
                    <div className="font-bold mb-1">Pay Online</div>
                    <div className="text-xs text-muted-foreground">UPI, Cards, Net Banking</div>
                  </div>
                  <div 
                    onClick={() => setPaymentMethod("CASH")}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-colors ${paymentMethod === "CASH" ? "border-primary bg-primary/5" : "border-gray-200"}`}
                  >
                    <div className="font-bold mb-1">Pay with Cash</div>
                    <div className="text-xs text-muted-foreground">Pay the waiter directly</div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="md:col-span-5">
            <div className="bg-stone-900 text-white p-6 rounded-2xl shadow-lg sticky top-24">
              <h3 className="font-serif text-xl font-bold mb-2">Ready to order?</h3>
              <p className="text-stone-300 text-sm mb-6">Your order will be sent directly to our kitchen.</p>
              
              <div className="flex justify-between items-center mb-6 text-lg">
                <span>To Pay</span>
                <span className="font-bold">₹{total}</span>
              </div>

              <Button 
                type="submit" 
                form="checkout-form" 
                size="lg" 
                className="w-full h-14 rounded-full text-lg font-medium bg-white text-stone-900 hover:bg-gray-100"
                disabled={isPending}
              >
                {isPending ? "Processing..." : "Place Order"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
