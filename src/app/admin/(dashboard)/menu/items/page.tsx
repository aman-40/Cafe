import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Check, X, Star } from "lucide-react";
import Image from "next/image";
import { ItemActions } from "./item-actions";

export const metadata = { title: "Manage Menu Items | Admin" };

export default async function ItemsPage() {
  await requirePermission("MENU_VIEW");

  const items = await prisma.menuItem.findMany({
    include: { category: true },
    orderBy: [{ category: { displayOrder: 'asc' } }, { displayOrder: 'asc' }]
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Menu Items</h2>
          <p className="text-muted-foreground text-sm">Manage items, prices, and availability.</p>
        </div>
        <Link href="/admin/menu/items/new" className={buttonVariants({ variant: "default" })}>
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center p-12 border rounded-xl bg-white">
          <p className="text-muted-foreground mb-4">No menu items yet.</p>
          <Link href="/admin/menu/items/new" className={buttonVariants({ variant: "default" })}>Add your first menu item</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50 border-b text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Availability</th>
                <th className="px-6 py-4">Featured</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted shrink-0">
                      <Image 
                        src={item.image || "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">{item.category?.name}</td>
                  <td className="px-6 py-4 font-semibold">₹{Number(item.price)}</td>
                  <td className="px-6 py-4">
                    <ItemActions id={item.id} field="isAvailable" currentValue={item.isAvailable} />
                  </td>
                  <td className="px-6 py-4">
                    <ItemActions id={item.id} field="isFeatured" currentValue={item.isFeatured} />
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link href={`/admin/menu/items/${item.id}/edit`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <ItemActions id={item.id} field="delete" currentValue={false} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
