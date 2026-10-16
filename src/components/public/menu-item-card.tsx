import Image from "next/image";
import Link from "next/link";
import { MenuItem, MenuCategory } from "@prisma/client";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "./add-to-cart-button";

type MenuItemCardProps = {
  item: MenuItem & { category?: MenuCategory };
};

export function MenuItemCard({ item }: MenuItemCardProps) {
  return (
    <Link href={`/menu/item/${item.slug}`} className="block group">
      <div className={cn(
        "flex gap-4 p-4 rounded-2xl border transition-all duration-300",
        item.isAvailable 
          ? "bg-white hover:shadow-md hover:border-primary/20" 
          : "bg-gray-50/80 opacity-80"
      )}>
        <div className="relative h-24 w-24 shrink-0 rounded-xl overflow-hidden bg-muted">
          <Image 
            src={item.image || "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=300&q=80"}
            alt={item.name}
            fill
            className={cn("object-cover", !item.isAvailable && "grayscale")}
          />
        </div>
        
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-serif font-semibold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                {item.name}
              </h3>
              <span className="font-semibold whitespace-nowrap">₹{Number(item.price)}</span>
            </div>
            {item.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            {!item.isAvailable && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                Unavailable
              </span>
            )}
            {item.isFeatured && item.isAvailable && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                Featured
              </span>
            )}
            <div className="ml-auto">
              <AddToCartButton item={{ ...item, price: Number(item.price) }} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
