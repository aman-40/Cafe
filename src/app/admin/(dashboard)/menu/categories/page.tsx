import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CategoryList } from "./category-list";

export const metadata = { title: "Manage Categories | Admin" };

export default async function CategoriesPage() {
  await requirePermission("MENU_VIEW");

  const categories = await prisma.menuCategory.findMany({
    include: {
      _count: { select: { items: true } }
    },
    orderBy: { displayOrder: 'asc' }
  });

  return <CategoryList categories={categories} />;
}
