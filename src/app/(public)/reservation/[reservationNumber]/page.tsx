import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Coffee, MapPin, CheckCircle, Clock, XCircle, Phone } from "lucide-react";
import { CancelReservationButton } from "./cancel-button";
import { Metadata } from "next";

export async function generateMetadata(
  props: { params: Promise<{ reservationNumber: string }> }
): Promise<Metadata> {
  const params = await props.params;
  return {
    title: `Reservation ${params.reservationNumber} | Premium Café`
  };
}

export default async function ReservationTrackingPage(
  props: { params: Promise<{ reservationNumber: string }> }
) {
  const params = await props.params;
  const reservation = await prisma.reservation.findUnique({
    where: { reservationNumber: params.reservationNumber },
    include: { table: true }
  });

  if (!reservation) {
    notFound();
  }

  const cafeSettings = await prisma.cafeSettings.findFirst();

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <div className="bg-stone-900 text-white py-12">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-tight mb-2">Reservation Details</h1>
          <p className="text-primary/80 text-xl font-mono">{reservation.reservationNumber}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 max-w-2xl">
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border mb-8">
          <div className="flex flex-col items-center text-center border-b pb-8 mb-8">
            {reservation.status === "CONFIRMED" && (
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
            )}
            {reservation.status === "PENDING" && (
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8" />
              </div>
            )}
            {reservation.status === "CANCELLED" && (
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8" />
              </div>
            )}
            
            <h2 className="text-2xl font-bold font-serif mb-2">
              {reservation.status === "CONFIRMED" ? "Reservation Confirmed" : 
               reservation.status === "PENDING" ? "Reservation Request Received" :
               reservation.status === "CANCELLED" ? "Reservation Cancelled" : 
               `Status: ${reservation.status}`}
            </h2>
            
            {reservation.status === "PENDING" && (
              <p className="text-muted-foreground">The café will confirm your reservation shortly.</p>
            )}
            {reservation.status === "CONFIRMED" && (
              <p className="text-muted-foreground">We look forward to hosting you, {reservation.customerName}.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Date</p>
              <p className="font-semibold">{format(reservation.reservationDate, 'd MMMM yyyy')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Time</p>
              <p className="font-semibold">{reservation.startTime}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Guests</p>
              <p className="font-semibold">{reservation.guestCount} {reservation.guestCount === 1 ? 'Person' : 'People'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Table</p>
              <p className="font-semibold">Table {reservation.table.tableNumber}</p>
            </div>
          </div>

          {(reservation.status === "PENDING" || reservation.status === "CONFIRMED") && (
            <div className="border-t pt-8 flex justify-center">
              <CancelReservationButton reservationNumber={reservation.reservationNumber} />
            </div>
          )}
        </div>

        {cafeSettings?.whatsapp && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border text-center flex flex-col items-center">
            <p className="text-muted-foreground mb-4">Need help with your reservation?</p>
            <a 
              href={`https://wa.me/${cafeSettings.whatsapp.replace(/\D/g,'')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-[#25D366] text-white hover:bg-[#25D366]/90 h-10 px-6 py-2"
            >
              <Phone className="w-4 h-4 mr-2" />
              Contact Café on WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
