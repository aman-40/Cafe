import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { ItemForm } from "../../item-form";
import { notFound } from "next/navigation";

export const metadata = { title: "Edit Menu Item | Admin" };

export default async function EditItemPage(props: { params: Promise<{ id: string }> }) {
  await requirePermission("MENU_MANAGE");

  const params = await props.params;
  const [item, categories, inventoryItems] = await Promise.all([
    prisma.menuItem.findUnique({ 
      where: { id: params.id },
      include: {
        ingredients: {
          include: {
            inventoryItem: true
          }
        }
      }
    }),
    prisma.menuCategory.findMany({ orderBy: { displayOrder: 'asc' } }),
    prisma.inventoryItem.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
  ]);

  if (!item) {
    notFound();
  }

  return <ItemForm item={item} categories={categories} inventoryItems={inventoryItems} />;
}
