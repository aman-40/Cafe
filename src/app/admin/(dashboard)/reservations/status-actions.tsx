"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateReservationStatus } from "./actions";
import { ReservationStatus } from "@prisma/client";
import { Check, X, Users, CheckCircle, UserMinus } from "lucide-react";

export function StatusActions({ id, currentStatus }: { id: string, currentStatus: ReservationStatus }) {
  const [isPending, setIsPending] = useState(false);

  async function handleStatus(status: ReservationStatus) {
    if (status === 'CANCELLED' || status === 'REJECTED' || status === 'NO_SHOW') {
      if (!confirm(`Are you sure you want to mark this as ${status}?`)) return;
    }
    
    setIsPending(true);
    await updateReservationStatus(id, status);
    setIsPending(false);
  }

  if (currentStatus === "PENDING") {
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleStatus('CONFIRMED')} disabled={isPending}>
          <Check className="w-4 h-4 mr-1" /> Confirm
        </Button>
        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatus('REJECTED')} disabled={isPending}>
          <X className="w-4 h-4 mr-1" /> Reject
        </Button>
      </div>
    );
  }

  if (currentStatus === "CONFIRMED") {
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleStatus('SEATED')} disabled={isPending}>
          <Users className="w-4 h-4 mr-1" /> Seated
        </Button>
        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatus('NO_SHOW')} disabled={isPending}>
          <UserMinus className="w-4 h-4 mr-1" /> No-Show
        </Button>
      </div>
    );
  }

  if (currentStatus === "SEATED") {
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="text-gray-600 border-gray-200 hover:bg-gray-50" onClick={() => handleStatus('COMPLETED')} disabled={isPending}>
          <CheckCircle className="w-4 h-4 mr-1" /> Completed
        </Button>
      </div>
    );
  }

  return <span className="text-xs text-muted-foreground">No actions</span>;
}
