import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, X } from "lucide-react";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Metadata } from "next";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "@/components/public/add-to-cart-button";
import { getEffectiveAvailability } from "@/lib/inventory-utils";

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const item = await prisma.menuItem.findUnique({
    where: { slug: params.slug },
    include: { 
      category: true,
      ingredients: { include: { inventoryItem: true } }
    }
  });

  if (!item) return { title: 'Not Found' };

  return {
    title: `${item.name} | Menu | Premium Café`,
    description: item.description || `View details for ${item.name}`,
  }
}

export default async function MenuItemPage(
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const rawItem = await prisma.menuItem.findUnique({
    where: { slug: params.slug },
    include: { 
      category: true,
      ingredients: { include: { inventoryItem: true } }
    }
  });

  if (!rawItem) {
    notFound();
  }

  const item = { ...rawItem, isAvailable: getEffectiveAvailability(rawItem) };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-4xl">
          <Link href="/menu" className={buttonVariants({ variant: "ghost", className: "mb-8 -ml-4 hover:bg-transparent hover:text-primary" })}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Menu
          </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
          {/* Image Gallery */}
          <div className="relative aspect-square md:aspect-[4/5] rounded-3xl overflow-hidden bg-muted shadow-lg">
            <Image 
              src={item.image || "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80"}
              alt={item.name}
              fill
              className={cn("object-cover", !item.isAvailable && "grayscale")}
              priority
            />
            {!item.isAvailable && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                <div className="bg-white text-black px-6 py-3 rounded-full font-bold uppercase tracking-wider text-sm shadow-xl">
                  Currently Unavailable
                </div>
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="flex flex-col justify-center">
            {item.category && (
              <Link 
                href={`/menu/${item.category.name.toLowerCase()}`}
                className="text-primary font-medium uppercase tracking-wider text-sm mb-4 hover:underline"
              >
                {item.category.name}
              </Link>
            )}
            
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-4 text-foreground">
              {item.name}
            </h1>
            
            <div className="text-3xl font-semibold text-primary mb-6">
              ₹{Number(item.price)}
            </div>

            {item.isFeatured && item.isAvailable && (
              <div className="inline-flex w-fit items-center px-3 py-1 mb-6 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                ✨ Chef&apos;s Special
              </div>
            )}

            {item.description && (
              <div className="prose prose-stone text-muted-foreground mb-8 text-lg">
                <p>{item.description}</p>
              </div>
            )}

            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex items-center justify-center rounded-full w-6 h-6",
                  item.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {item.isAvailable ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </div>
                <span className="font-medium text-foreground">
                  {item.isAvailable ? "Available to order" : "Temporarily unavailable"}
                </span>
              </div>
              
              <div className="pt-4">
                <AddToCartButton variant="default" item={{ ...item, price: Number(item.price) }} />
              </div>
            </div>
            
            <div className="mt-12 bg-secondary/50 rounded-2xl p-6 text-sm text-muted-foreground">
              <p>Please inform your server of any allergies or dietary requirements before ordering.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
