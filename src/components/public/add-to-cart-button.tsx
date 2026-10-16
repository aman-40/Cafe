"use client";

import { useCartStore } from "@/lib/store/cart";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type AddToCartButtonProps = {
  item: {
    id: string;
    name: string;
    price: number;
    isAvailable: boolean;
  };
  variant?: "icon" | "default";
};

export function AddToCartButton({ item, variant = "icon" }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: 1,
    });
  };

  if (!item.isAvailable) return null;

  if (variant === "default") {
    return (
      <Button onClick={handleAdd} className="w-full rounded-full h-12 text-lg">
        Add to Order
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleAdd}
      size="icon" 
      variant="secondary"
      className="h-8 w-8 rounded-full shrink-0 shadow-sm border border-border"
    >
      <Plus className="h-4 w-4" />
      <span className="sr-only">Add {item.name} to cart</span>
    </Button>
  );
}
