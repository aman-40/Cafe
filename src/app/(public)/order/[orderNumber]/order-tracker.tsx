"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, Clock, ChefHat, Utensils, AlertTriangle, Coffee } from "lucide-react";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  notes: string | null;
};

type OrderData = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  createdAt: string;
  tableId: string | null;
  table?: { tableNumber: string } | null;
  items: OrderItem[];
  payments?: {
    id: string;
    status: string;
    method: string | null;
  }[];
};

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PREPARING", "READY", "COMPLETED"];

export function OrderTracker({ initialOrder }: { initialOrder: OrderData }) {
  const [order, setOrder] = useState<OrderData>(initialOrder);

  useEffect(() => {
    const supabase = createClient();
    
    // Subscribe to changes on this specific order
    const channel = supabase
      .channel(`public:order:${order.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Order',
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          if (payload.new && payload.new.status) {
            setOrder((prev) => ({ ...prev, status: payload.new.status }));
          }
        }
      )
      .subscribe();

    const paymentChannel = supabase
      .channel(`public:payment:${order.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Payment',
          filter: `orderId=eq.${order.id}`,
        },
        (payload) => {
          if (payload.new) {
            setOrder((prev) => {
              const newPayments = [...(prev.payments || [])];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const payloadNew = payload.new as any;
              const idx = newPayments.findIndex(p => p.id === payloadNew.id);
              if (idx >= 0) {
                newPayments[idx] = { ...newPayments[idx], ...payloadNew };
              } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                newPayments.push(payloadNew);
              }
              return { ...prev, payments: newPayments };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(paymentChannel);
    };
  }, [order.id]);

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === "CANCELLED";

  function getStepIcon(step: string, index: number) {
    if (index < currentStepIndex || step === "COMPLETED") return <Check className="w-5 h-5" />;
    switch (step) {
      case "PENDING": return <Clock className="w-5 h-5" />;
      case "CONFIRMED": return <Check className="w-5 h-5" />;
      case "PREPARING": return <ChefHat className="w-5 h-5" />;
      case "READY": return <Utensils className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  }

  function getStepLabel(step: string) {
    switch (step) {
      case "PENDING": return "Received";
      case "CONFIRMED": return "Confirmed";
      case "PREPARING": return "Preparing";
      case "READY": return "Ready to Serve";
      case "COMPLETED": return "Completed";
      default: return step;
    }
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Coffee className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-2">Order {order.orderNumber}</h1>
          {order.table && (
            <p className="text-lg text-muted-foreground">Table {order.table.tableNumber}</p>
          )}
        </div>

        {isCancelled ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl text-center mb-8">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <h2 className="text-xl font-bold mb-2">Order Cancelled</h2>
            <p>We&apos;re sorry, this order has been cancelled. Please speak with our staff if you have any questions.</p>
          </div>
        ) : (
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border mb-8">
            <h2 className="font-bold text-lg mb-6">Live Status</h2>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {STATUS_STEPS.map((step, index) => {
                const isActive = index === currentStepIndex;
                const isPast = index < currentStepIndex;
                const isFuture = index > currentStepIndex;
                
                return (
                  <div key={step} className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active-${isActive}`}>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white z-10 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${
                      isActive ? "border-primary text-primary" : 
                      isPast ? "border-primary bg-primary text-white" : 
                      "border-gray-200 text-gray-400"
                    }`}>
                      {getStepIcon(step, index)}
                    </div>
                    
                    <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border ${
                      isActive ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-transparent border-transparent"
                    }`}>
                      <h3 className={`font-bold text-base ${isActive ? "text-primary" : isPast ? "text-foreground" : "text-gray-400"}`}>
                        {getStepLabel(step)}
                      </h3>
                      {isActive && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {step === "PENDING" && "Waiting for kitchen to confirm."}
                          {step === "CONFIRMED" && "Order accepted by kitchen."}
                          {step === "PREPARING" && "Our chefs are preparing your items."}
                          {step === "READY" && "Your order is ready to be served!"}
                          {step === "COMPLETED" && "Enjoy your meal!"}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment Status Block */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border mb-8">
          <h2 className="font-bold text-lg mb-4">Payment Status</h2>
          {order.payments && order.payments.length > 0 ? (
            <div className="space-y-4">
              {order.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
                  <div>
                    <p className="font-medium">
                      {payment.method === "CASH" ? "Cash Payment" : "Online Payment"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Status: <span className="font-bold">{payment.status}</span></p>
                  </div>
                  <div>
                    {payment.status === "PAID" ? (
                      <div className="bg-green-100 text-green-700 p-2 rounded-full"><Check className="w-5 h-5" /></div>
                    ) : payment.status === "FAILED" ? (
                      <div className="bg-red-100 text-red-700 p-2 rounded-full"><AlertTriangle className="w-5 h-5" /></div>
                    ) : (
                      <div className="bg-blue-100 text-blue-700 p-2 rounded-full"><Clock className="w-5 h-5" /></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No payment records found.</p>
          )}
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border">
          <h2 className="font-bold text-lg mb-4">Order Details</h2>
          <ul className="space-y-4 mb-6">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between items-start pb-4 border-b last:border-0 last:pb-0">
                <div>
                  <div className="font-medium">{item.quantity} × {item.name}</div>
                  {item.notes && <div className="text-sm text-muted-foreground mt-1">Note: {item.notes}</div>}
                </div>
                <div className="font-medium whitespace-nowrap">
                  ₹{item.subtotal}
                </div>
              </li>
            ))}
          </ul>
          
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-sm mb-2 text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span>₹{order.total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
