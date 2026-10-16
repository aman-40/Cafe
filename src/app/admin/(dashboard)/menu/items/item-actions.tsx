/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Star, Check, X } from "lucide-react";
import { toggleItemStatus, deleteItem } from "./actions";

type Props = {
  id: string;
  field: "isAvailable" | "isFeatured" | "delete";
  currentValue: boolean;
};

export function ItemActions({ id, field, currentValue }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleItemStatus(id, field as any, currentValue);
    });
  }

  function handleDelete() {
    if (confirm("Are you sure you want to delete this menu item? This action cannot be undone.")) {
      startTransition(async () => {
        await deleteItem(id);
      });
    }
  }

  if (field === "delete") {
    return (
      <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleDelete} disabled={isPending}>
        <Trash2 className="h-4 w-4" />
      </Button>
    );
  }

  if (field === "isFeatured") {
    return (
      <button 
        onClick={handleToggle}
        disabled={isPending}
        className={`p-1.5 rounded-full transition-colors ${currentValue ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:bg-gray-100'}`}
        title={currentValue ? "Remove from Featured" : "Mark as Featured"}
      >
        <Star className="h-4 w-4" fill={currentValue ? "currentColor" : "none"} />
      </button>
    );
  }

  return (
    <button 
      onClick={handleToggle}
      disabled={isPending}
      className={`px-2.5 py-1 text-xs font-medium rounded-full ${currentValue ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
    >
      {currentValue ? "Available" : "Unavailable"}
    </button>
  );
}
