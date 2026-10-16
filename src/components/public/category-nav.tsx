import Link from "next/link";
import { MenuCategory } from "@prisma/client";
import { cn } from "@/lib/utils";

type CategoryNavProps = {
  categories: MenuCategory[];
  activeCategoryId?: string;
};

export function CategoryNav({ categories, activeCategoryId }: CategoryNavProps) {
  return (
    <div className="w-full overflow-x-auto hide-scrollbar border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-40">
      <div className="container mx-auto px-4 md:px-6">
        <nav className="flex space-x-6 whitespace-nowrap py-4">
          <Link
            href="/menu"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary pb-4 border-b-2 -mb-[17px]",
              !activeCategoryId ? "text-primary border-primary" : "text-muted-foreground border-transparent"
            )}
          >
            All Items
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/menu/${category.name.toLowerCase()}`}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary pb-4 border-b-2 -mb-[17px]",
                activeCategoryId === category.id ? "text-primary border-primary" : "text-muted-foreground border-transparent"
              )}
            >
              {category.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
