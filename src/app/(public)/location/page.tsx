import { prisma } from "@/lib/prisma";
import { MapPin, Navigation, Clock } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Location | Premium Café',
  description: 'Find us here.',
}

export default async function LocationPage() {
  const cafeSettings = await prisma.cafeSettings.findFirst();
  
  // Create a maps search query based on address
  const mapsQuery = encodeURIComponent(`${cafeSettings?.name} ${cafeSettings?.address} ${cafeSettings?.city}`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="bg-stone-900 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight mb-4">Location</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto font-light">
            Find your way to {cafeSettings?.name || "us"}.
          </p>
        </div>
      </div>

      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
            <div className="lg:col-span-2 space-y-8">
              <h2 className="text-3xl font-serif font-bold text-foreground">Where to find us</h2>
              
              <div className="space-y-6 bg-secondary/20 p-8 rounded-3xl border border-border/50">
                <div className="flex items-start gap-4">
                  <MapPin className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-1">Address</h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {cafeSettings?.address}
                      {cafeSettings?.city ? `\n${cafeSettings.city}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pt-6 border-t border-border">
                  <Clock className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg mb-1">Opening Hours</h3>
                    {cafeSettings?.openingHours ? (
                      <pre className="text-muted-foreground leading-relaxed font-sans whitespace-pre-line">
                        {String(cafeSettings.openingHours)}
                      </pre>
                    ) : (
                      <p className="text-muted-foreground">Hours not available</p>
                    )}
                  </div>
                </div>

                <div className="pt-8">
                    <Link href={mapsUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "lg", className: "w-full rounded-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground" })}>
                      <Navigation className="mr-2 h-5 w-5" /> Get Directions
                    </Link>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="aspect-square lg:aspect-video w-full rounded-3xl overflow-hidden bg-muted relative shadow-xl border border-border">
                {/* Fallback placeholder since we aren't embedding paid maps api */}
                <div className="absolute inset-0 bg-stone-100 flex flex-col items-center justify-center p-8 text-center">
                  <MapPin className="h-16 w-16 text-primary/40 mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">Interactive Map Area</p>
                  <p className="text-muted-foreground max-w-sm mb-6">
                    Click the button below to open Google Maps for accurate directions and navigation.
                  </p>
                    <Link href={mapsUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", className: "rounded-full" })}>
                      Open in Google Maps
                    </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
