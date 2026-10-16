import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Coffee, MapPin, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { withEffectiveAvailability } from "@/lib/inventory-utils";

export const metadata = {
  title: 'Home | Premium Café',
  description: 'Welcome to our premium artisan café.',
}

export default async function HomePage() {
  const [cafeSettings, featuredItems, categories] = await Promise.all([
    prisma.cafeSettings.findFirst(),
    prisma.menuItem.findMany({
      where: { isFeatured: true, isAvailable: true },
      include: { 
        category: true,
        ingredients: { include: { inventoryItem: true } }
      },
      take: 4,
    }),
    prisma.menuCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      take: 4,
    })
  ]);

  const effectiveFeaturedItems = withEffectiveAvailability(featuredItems);

  const cafeName = cafeSettings?.name || "The Premium Café";
  const description = cafeSettings?.description || "Experience artisan coffee and crafted food in a warm, inviting atmosphere.";

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-stone-900">
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 bg-black/40 z-10" />
          <Image 
            src={cafeSettings?.coverImage || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80"}
            alt="Cafe Interior"
            fill
            priority
            className="object-cover opacity-80"
          />
        </div>
        
        <div className="relative z-20 container mx-auto px-4 md:px-6 flex flex-col items-center text-center text-white">
          <Coffee className="h-12 w-12 mb-6 opacity-90" />
          <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight mb-6 max-w-4xl drop-shadow-lg">
            {cafeName}
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-2xl mb-10 drop-shadow-md">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/menu" className={buttonVariants({ size: "lg", className: "rounded-full text-base h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground border-none" })}>Explore Menu</Link>
            <Link href="/location" className={buttonVariants({ size: "lg", variant: "outline", className: "rounded-full text-base h-14 px-8 bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm" })}>Visit Us</Link>
          </div>
        </div>
      </section>

      {/* Featured Items */}
      {featuredItems.length > 0 && (
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">House Favorites</h2>
              <p className="text-muted-foreground max-w-2xl">Discover our most loved artisan creations, crafted with passion and premium ingredients.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {effectiveFeaturedItems.map(item => (
                <Link href={`/menu/item/${item.slug}`} key={item.id} className="group flex flex-col gap-4">
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
                    <Image 
                      src={item.image || "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80"}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
                      {item.category.name}
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-xl font-serif font-semibold group-hover:text-primary transition-colors line-clamp-1">{item.name}</h3>
                      <span className="font-semibold text-primary">₹{Number(item.price)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-12 text-center">
                <Link href="/menu" className={buttonVariants({ variant: "ghost", className: "group" })}>
                  View Full Menu <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>
          </div>
        </section>
      )}

      {/* Categories / Menu Preview */}
      {categories.length > 0 && (
        <section className="py-24 bg-secondary/50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-6">Something for everyone</h2>
                <p className="text-lg text-muted-foreground mb-8">From freshly roasted single-origin coffees to artisan pastries and hearty mains. Explore our carefully curated menus.</p>
                
                <div className="space-y-4">
                  {categories.map(category => (
                    <Link href={`/menu/${category.name.toLowerCase()}`} key={category.id} className="block group border-b border-border pb-4 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-medium group-hover:text-primary transition-colors">{category.name}</span>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="relative h-[600px] rounded-3xl overflow-hidden hidden lg:block">
                <Image 
                  src="https://images.unsplash.com/photo-1559925393-8be0a33e7efa?auto=format&fit=crop&q=80"
                  alt="Menu showcase"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-foreground mb-4">Our Philosophy</h2>
            <p className="text-muted-foreground">We believe in quality without compromise, creating spaces that feel like home and food that brings people together.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-6 text-primary">
                <Coffee className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Artisan Quality</h3>
              <p className="text-muted-foreground">Carefully sourced ingredients prepared with precision and care.</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-6 text-primary">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Freshly Made</h3>
              <p className="text-muted-foreground">Baked, brewed, and prepared fresh daily in our kitchen.</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-6 text-primary">
                <MapPin className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Warm Atmosphere</h3>
              <p className="text-muted-foreground">A welcoming space designed for connection, work, or relaxation.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
