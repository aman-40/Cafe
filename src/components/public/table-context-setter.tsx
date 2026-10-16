"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/store/cart";

export function TableContextSetter({ tableNumber }: { tableNumber: string | null }) {
  const setTableNumber = useCartStore(state => state.setTableNumber);
  
  useEffect(() => {
    setTableNumber(tableNumber);
  }, [tableNumber, setTableNumber]);

  return null;
}
