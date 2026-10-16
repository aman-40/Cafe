"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateOrderStatus, updatePaymentStatus } from "./actions";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Clock, Check, ChefHat, Utensils, X, Info } from "lucide-react";

type OrderData = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  table?: { tableNumber: string } | null;
  customerName: string | null;
  notes: string | null;
  items: {
    id: string;
    name: string;
    quantity: number;
    notes: string | null;
  }[];
  payments?: {
    id: string;
    status: string;
    method: string | null;
  }[];
};

const COLUMNS = [
  { id: OrderStatus.PENDING, title: "New Orders", color: "bg-blue-50 border-blue-200" },
  { id: OrderStatus.CONFIRMED, title: "Confirmed", color: "bg-purple-50 border-purple-200" },
  { id: OrderStatus.PREPARING, title: "Preparing", color: "bg-amber-50 border-amber-200" },
  { id: OrderStatus.READY, title: "Ready", color: "bg-green-50 border-green-200" },
];

export function KanbanBoard({ initialOrders }: { initialOrders: OrderData[] }) {
  const [orders, setOrders] = useState<OrderData[]>(initialOrders);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel('public:orders_kitchen')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Order' },
        (payload) => {
          // Simplest realtime: reload data or push specifically. 
          // For a true SPA, you'd fetch the specific order details. 
          // Since it's a demo, we can just do a full page refresh or fetch the new order.
          // In this implementation, we will refresh the route to get all relational data properly.
          window.location.reload();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleStatusChange(id: string, newStatus: OrderStatus) {
    setLoadingId(id);
    try {
      await updateOrderStatus(id, newStatus);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setLoadingId(null);
    }
  }

  async function handlePaymentConfirm(paymentId: string) {
    setLoadingId(paymentId);
    try {
      await updatePaymentStatus(paymentId, PaymentStatus.PAID);
      // Let realtime/refresh handle state update
      window.location.reload();
    } catch (err) {
      alert("Failed to confirm payment");
    } finally {
      setLoadingId(null);
    }
  }

  function renderOrderCard(order: OrderData) {
    const timeAgo = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);
    
    return (
      <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-bold text-lg leading-none">{order.orderNumber}</h4>
            <div className="flex flex-wrap gap-1 mt-2">
              {order.table && (
                <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-700">
                  Table {order.table.tableNumber}
                </span>
              )}
              {order.payments && order.payments.length > 0 && (
                <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                  order.payments[0].status === "PAID" ? "bg-green-100 text-green-700" :
                  order.payments[0].status === "FAILED" ? "bg-red-100 text-red-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {order.payments[0].method} - {order.payments[0].status}
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-medium text-muted-foreground flex items-center justify-end gap-1">
              <Clock className="h-3 w-3" /> {timeAgo}m ago
            </div>
            <div className="font-bold text-sm mt-1">₹{order.total}</div>
            {order.customerName && <div className="text-xs text-muted-foreground mt-1">{order.customerName}</div>}
          </div>
        </div>

        {order.notes && (
          <div className="bg-yellow-50 text-yellow-800 text-xs p-2 rounded mb-3 border border-yellow-200">
            <strong>Note:</strong> {order.notes}
          </div>
        )}

        <div className="space-y-2 mb-4">
          {order.items.map(item => (
            <div key={item.id} className="text-sm">
              <div className="flex items-start gap-2">
                <span className="font-bold shrink-0">{item.quantity} ×</span>
                <span className="font-medium">{item.name}</span>
              </div>
              {item.notes && <div className="text-xs text-muted-foreground ml-6 italic">Note: {item.notes}</div>}
            </div>
          ))}
        </div>

        <div className="pt-3 border-t flex flex-wrap gap-2">
          {order.status === OrderStatus.PENDING && (
            <Button size="sm" className="w-full" onClick={() => handleStatusChange(order.id, OrderStatus.CONFIRMED)} disabled={loadingId === order.id}>
              Confirm Order
            </Button>
          )}
          {order.status === OrderStatus.CONFIRMED && (
            <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={() => handleStatusChange(order.id, OrderStatus.PREPARING)} disabled={loadingId === order.id}>
              Start Preparing
            </Button>
          )}
          {order.status === OrderStatus.PREPARING && (
            <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusChange(order.id, OrderStatus.READY)} disabled={loadingId === order.id}>
              Mark Ready
            </Button>
          )}
          {order.status === OrderStatus.READY && (
            <Button size="sm" className="w-full" onClick={() => handleStatusChange(order.id, OrderStatus.COMPLETED)} disabled={loadingId === order.id}>
              Complete Order
            </Button>
          )}

          {order.payments && order.payments[0]?.method === "CASH" && order.payments[0]?.status === "PENDING" && (
            <Button size="sm" variant="outline" className="w-full border-green-200 text-green-700 bg-green-50 hover:bg-green-100" onClick={() => handlePaymentConfirm(order.payments![0].id)} disabled={loadingId === order.payments![0].id}>
              Confirm Cash Payment
            </Button>
          )}
          
          {(order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED) && (
            <Button variant="ghost" size="sm" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => {
              if (confirm("Are you sure you want to cancel this order?")) {
                handleStatusChange(order.id, OrderStatus.CANCELLED);
              }
            }} disabled={loadingId === order.id}>
              Cancel Order
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max h-full items-start">
        {COLUMNS.map(column => {
          const columnOrders = orders.filter(o => o.status === column.id);
          
          return (
            <div key={column.id} className={`w-80 flex-shrink-0 flex flex-col rounded-2xl border ${column.color} bg-opacity-50 h-full max-h-[calc(100vh-12rem)]`}>
              <div className="p-4 border-b border-inherit bg-white/50 rounded-t-2xl flex justify-between items-center">
                <h3 className="font-bold text-gray-800">{column.title}</h3>
                <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold border">
                  {columnOrders.length}
                </span>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                {columnOrders.length === 0 ? (
                  <div className="text-center p-6 text-muted-foreground text-sm flex flex-col items-center opacity-50">
                    <Info className="h-8 w-8 mb-2" />
                    No orders
                  </div>
                ) : (
                  columnOrders.map(renderOrderCard)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
