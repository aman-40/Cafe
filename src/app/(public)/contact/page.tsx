import { prisma } from "@/lib/prisma";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Contact Us | Premium Café',
  description: 'Get in touch with us.',
}

export default async function ContactPage() {
  const cafeSettings = await prisma.cafeSettings.findFirst();
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="bg-stone-900 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight mb-4">Contact Us</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto font-light">
            We&apos;d love to hear from you.
          </p>
        </div>
      </div>

      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-serif font-bold mb-6 text-foreground">Get in Touch</h2>
              <p className="text-muted-foreground mb-10 text-lg">
                Have a question about our menu, an event, or just want to say hello? Reach out to us through any of the channels below.
              </p>

              <div className="space-y-8">
                {cafeSettings?.phone && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Phone</h3>
                      <p className="text-muted-foreground">{cafeSettings.phone}</p>
                    </div>
                  </div>
                )}
                
                {cafeSettings?.whatsapp && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0 text-green-600">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">WhatsApp</h3>
                      <p className="text-muted-foreground mb-3">{cafeSettings.whatsapp}</p>
                        <Link href={`https://wa.me/${cafeSettings.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "sm", className: "bg-green-600 hover:bg-green-700 text-white rounded-full" })}>
                          Chat on WhatsApp
                        </Link>
                    </div>
                  </div>
                )}

                {cafeSettings?.email && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Email</h3>
                      <p className="text-muted-foreground">{cafeSettings.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-secondary/30 rounded-3xl p-8 md:p-12 h-fit">
              <h3 className="text-2xl font-serif font-bold mb-6">Visit Us</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-3 text-muted-foreground">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-foreground">Address</p>
                    <p className="whitespace-pre-line leading-relaxed">
                      {cafeSettings?.address || "Location pending"}
                      {cafeSettings?.city ? `\n${cafeSettings.city}` : ""}
                    </p>
                  </div>
                </div>

                {cafeSettings?.openingHours && (
                  <div className="border-t border-border pt-6 mt-6 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-2 text-base">Opening Hours</p>
                    <pre className="whitespace-pre-line font-sans text-muted-foreground leading-relaxed">
                      {String(cafeSettings.openingHours)}
                    </pre>
                  </div>
                )}
                
                <div className="pt-4">
                    <Link href="/location" className={buttonVariants({ variant: "outline", className: "w-full rounded-full h-12" })}>View Location & Map</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
