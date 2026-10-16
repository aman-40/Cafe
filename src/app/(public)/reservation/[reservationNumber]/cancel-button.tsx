"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cancelReservation } from "./actions";

export function CancelReservationButton({ reservationNumber }: { reservationNumber: string }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this reservation?")) return;
    
    setIsPending(true);
    const res = await cancelReservation(reservationNumber);
    setIsPending(false);
    
    if (res.error) {
      setError(res.error);
    }
  }

  return (
    <div className="flex flex-col items-center w-full">
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <Button 
        variant="outline" 
        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 w-full md:w-auto"
        onClick={handleCancel}
        disabled={isPending}
      >
        {isPending ? "Cancelling..." : "Cancel Reservation"}
      </Button>
    </div>
  );
}
