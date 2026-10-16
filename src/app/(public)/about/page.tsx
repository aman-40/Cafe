import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { Coffee, Heart, Leaf } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'About Us | Premium Café',
  description: 'Learn about our story and our philosophy.',
}

export default async function AboutPage() {
  const cafeSettings = await prisma.cafeSettings.findFirst();
  
  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-stone-900 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/40" />
        <Image 
          src="https://images.unsplash.com/photo-1445116572658-2207407a4c48?auto=format&fit=crop&q=80"
          alt="Cafe Background"
          fill
          className="object-cover -z-10 opacity-60"
        />
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight mb-4">Our Story</h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto font-light">
            Crafting moments, one cup at a time.
          </p>
        </div>
      </div>

      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
              <Image 
                src="https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&q=80"
                alt="Cafe interior"
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground">
                About {cafeSettings?.name || "Us"}
              </h2>
              <div className="prose prose-stone prose-lg text-muted-foreground">
                <p>
                  {cafeSettings?.description || "Welcome to our café, a space built on a passion for exceptional coffee and heartfelt hospitality. We believe that a great café is more than just a place to grab a drink—it's a community hub, a creative space, and a comforting retreat."}
                </p>
                <p>
                  Our journey began with a simple idea: to serve the highest quality artisan coffee alongside freshly prepared, delicious food in an environment that makes everyone feel at home.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">Our Values</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center max-w-5xl mx-auto">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                <Coffee className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Quality</h3>
              <p className="text-muted-foreground">We never compromise on the quality of our beans or ingredients.</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                <Heart className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Community</h3>
              <p className="text-muted-foreground">Creating a welcoming space where connections are made.</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                <Leaf className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Sustainability</h3>
              <p className="text-muted-foreground">Mindful of our footprint, from sourcing to serving.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
