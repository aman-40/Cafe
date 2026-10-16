"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkAvailability, createReservation } from "./actions";
import { useRouter } from "next/navigation";
import { format, addDays, isBefore, startOfToday } from "date-fns";

export function ReservationForm() {
  const router = useRouter();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [date, setDate] = useState(format(startOfToday(), 'yyyy-MM-dd'));
  const [time, setTime] = useState("19:00");
  const [guests, setGuests] = useState(2);
  const [tableInfo, setTableInfo] = useState<{ id: string; tableNumber: string; capacity: number } | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");

  const timeSlots = [
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"
  ];

  async function handleCheckAvailability(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    if (isBefore(new Date(date), startOfToday())) {
      setError("Please select a valid future date.");
      return;
    }

    setIsPending(true);
    const res = await checkAvailability({ date, time, guests });
    setIsPending(false);

    if (res.error) {
      setError(res.error);
    } else if (res.table) {
      setTableInfo(res.table);
      setStep(2);
    }
  }

  async function handleSubmitReservation(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const res = await createReservation({
      date, time, guests,
      customerName,
      customerPhone,
      customerEmail,
      specialRequest
    });

    setIsPending(false);

    if (res.error) {
      setError(res.error);
    } else if (res.success) {
      router.push(`/reservation/${res.reservationNumber}`);
    }
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl border shadow-sm">
      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleCheckAvailability} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input 
              type="date" 
              id="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              min={format(startOfToday(), 'yyyy-MM-dd')}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time *</Label>
            <select
              id="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="" disabled>Select Time</option>
              {timeSlots.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guests">Number of Guests *</Label>
            <select
              id="guests"
              value={guests}
              onChange={e => setGuests(Number(e.target.value))}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(g => (
                <option key={g} value={g}>{g} {g === 1 ? 'Guest' : 'Guests'}</option>
              ))}
            </select>
          </div>

          <Button type="submit" className="w-full h-12 text-lg" disabled={isPending}>
            {isPending ? "Checking..." : "Check Availability"}
          </Button>
        </form>
      )}

      {step === 2 && tableInfo && (
        <form onSubmit={handleSubmitReservation} className="space-y-6">
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 mb-6">
            <h3 className="font-medium text-primary mb-2">Availability Confirmed</h3>
            <p className="text-sm text-primary/80 mb-1">Date: {format(new Date(date), 'MMM d, yyyy')} at {time}</p>
            <p className="text-sm text-primary/80">Table {tableInfo.tableNumber} ({guests} Guests)</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Full Name *</Label>
              <Input 
                id="customerName" 
                value={customerName} 
                onChange={e => setCustomerName(e.target.value)} 
                required 
                placeholder="Aman Sharma"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone Number *</Label>
              <Input 
                id="customerPhone" 
                type="tel"
                value={customerPhone} 
                onChange={e => setCustomerPhone(e.target.value)} 
                required 
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email (Optional)</Label>
              <Input 
                id="customerEmail" 
                type="email"
                value={customerEmail} 
                onChange={e => setCustomerEmail(e.target.value)} 
                placeholder="aman@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialRequest">Special Request (Optional)</Label>
              <Input 
                id="specialRequest" 
                value={specialRequest} 
                onChange={e => setSpecialRequest(e.target.value)} 
                placeholder="e.g. Anniversary, wheelchair access"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <Button type="button" variant="outline" className="w-full" onClick={() => setStep(1)} disabled={isPending}>
              Back
            </Button>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Confirming..." : "Confirm Reservation"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
