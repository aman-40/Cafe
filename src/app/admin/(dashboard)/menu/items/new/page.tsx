import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { ItemForm } from "../item-form";

export const metadata = { title: "New Menu Item | Admin" };

export default async function NewItemPage() {
  await requirePermission("MENU_MANAGE");

  const categories = await prisma.menuCategory.findMany({ 
    orderBy: { displayOrder: 'asc' },
    where: { isActive: true }
  });

  return <ItemForm categories={categories} />;
}
