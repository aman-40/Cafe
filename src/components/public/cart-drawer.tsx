"use client";

import { useState } from "react";
import { ShoppingBag, X, Plus, Minus, Info } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCartStore } from "@/lib/store/cart";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export function CartDrawer() {
  const { items, tableNumber, removeItem, updateQuantity, updateNotes, getCartTotal, clearCart } = useCartStore();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const total = getCartTotal();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    setIsOpen(false);
    router.push("/checkout");
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger className={buttonVariants({ variant: "outline", size: "icon", className: "relative rounded-full" })}>
        <ShoppingBag className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
            {itemCount}
          </span>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full bg-white border-l">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="font-serif text-2xl">Your Order</SheetTitle>
          {tableNumber && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
              Table {tableNumber}
            </p>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 -mx-6 px-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
              <div>
                <p className="font-medium text-lg">Your cart is empty</p>
                <p className="text-muted-foreground text-sm mt-1">Add items from the menu to get started.</p>
              </div>
              <Button onClick={() => setIsOpen(false)} variant="outline" className="mt-4 rounded-full">
                Browse Menu
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {!tableNumber && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex gap-3 items-start border border-red-100">
                  <Info className="h-5 w-5 shrink-0 mt-0.5" />
                  <p>
                    <strong>No Table Found:</strong> Please scan the café table QR code to place an order.
                  </p>
                </div>
              )}
              
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.id} className="flex flex-col gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium leading-none">{item.name}</h4>
                        <p className="text-primary font-medium text-sm mt-1">₹{item.price}</p>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center bg-white border rounded-full overflow-hidden">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1 text-gray-500 hover:bg-gray-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-3 font-medium text-sm min-w-[2rem] text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 text-gray-500 hover:bg-gray-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="ml-auto font-semibold">
                        ₹{item.price * item.quantity}
                      </div>
                    </div>

                    <div className="mt-2">
                      <Input 
                        placeholder="Add note (e.g. less sugar)..." 
                        value={item.notes || ""}
                        onChange={(e) => updateNotes(item.id, e.target.value)}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="pt-4 border-t mt-auto">
            <div className="flex justify-between items-center mb-6">
              <span className="font-medium text-lg text-muted-foreground">Subtotal</span>
              <span className="font-bold text-2xl">₹{total}</span>
            </div>
            
            <Button 
              size="lg" 
              className="w-full h-14 text-lg rounded-xl" 
              disabled={!tableNumber}
              onClick={handleCheckout}
            >
              {!tableNumber ? "Scan QR to Order" : "Checkout"}
            </Button>
            <div className="mt-3 text-center">
              <button 
                onClick={clearCart} 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
