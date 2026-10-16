import { prisma } from "@/lib/prisma";
import { MenuItemCard } from "@/components/public/menu-item-card";
import { CategoryNav } from "@/components/public/category-nav";
import { SearchBar } from "@/components/public/search-bar";
import { TableContextSetter } from "@/components/public/table-context-setter";
import { Coffee } from "lucide-react";
import { Metadata } from "next";
import { withEffectiveAvailability } from "@/lib/inventory-utils";

export const metadata: Metadata = {
  title: 'Menu | Premium Café',
  description: 'Explore our artisan menu.',
}

export default async function MenuPage(
  props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
  }
) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams?.q === 'string' ? searchParams.q : undefined;
  const tableParam = typeof searchParams?.table === 'string' ? searchParams.table : undefined;
  let activeTable = null;
  if (tableParam) {
    activeTable = await prisma.cafeTable.findFirst({
      where: { tableNumber: tableParam, isActive: true }
    });
  }

  const [categories, items, cafeSettings] = await Promise.all([
    prisma.menuCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    }),
    prisma.menuItem.findMany({
      where: {
        ...(q ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { category: { name: { contains: q, mode: 'insensitive' } } }
          ]
        } : {})
      },
      include: { 
        category: true,
        ingredients: { include: { inventoryItem: true } }
      },
      orderBy: [
        { category: { displayOrder: 'asc' } },
        { displayOrder: 'asc' }
      ],
    }),
    prisma.cafeSettings.findFirst()
  ]);

  const effectiveItems = withEffectiveAvailability(items);

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <div className="bg-stone-900 text-white py-12 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight mb-4">Our Menu</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Carefully crafted, freshly prepared.
          </p>
        </div>
      </div>

      <CategoryNav categories={categories} />
      <TableContextSetter tableNumber={activeTable?.tableNumber || null} />

      <div className="container mx-auto px-4 md:px-6 py-8">
        {activeTable && (
          <div className="mb-8 bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-center gap-3 text-primary max-w-md mx-auto">
            <Coffee className="h-5 w-5" />
            <p className="font-medium text-sm">
              You&apos;re viewing the menu from <span className="font-bold">Table {activeTable.tableNumber}</span>
            </p>
          </div>
        )}

        <div className="mb-10 flex justify-center md:justify-start">
          <SearchBar />
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-serif font-medium mb-2">No items found</h2>
            <p className="text-muted-foreground">
              {q ? "We couldn't find anything matching your search." : "Our menu is being updated. Please check back soon."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {effectiveItems.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
