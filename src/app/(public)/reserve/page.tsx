import { Metadata } from "next";
import { ReservationForm } from "./reservation-form";

export const metadata: Metadata = {
  title: 'Reserve a Table | Premium Café',
  description: 'Book a table at our premium artisan café.',
}

export default function ReservePage() {
  return (
    <div className="min-h-screen flex flex-col pb-20">
      <div className="bg-stone-900 text-white py-12 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight mb-4">Reserve a Table</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Join us for an unforgettable artisan experience.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="max-w-xl mx-auto">
          <ReservationForm />
        </div>
      </div>
    </div>
  );
}
