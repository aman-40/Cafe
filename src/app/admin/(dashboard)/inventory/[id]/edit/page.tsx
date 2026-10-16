import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditInventoryClient from "./edit-client";

export default async function EditInventoryPage(props: { params: Promise<{ id: string }> }) {
  await requirePermission("INVENTORY_MANAGE");

  const params = await props.params;
  const item = await prisma.inventoryItem.findUnique({
    where: { id: params.id }
  });

  if (!item) {
    notFound();
  }

  // Pass a clean plain object
  const cleanItem = {
    id: item.id,
    name: item.name,
    sku: item.sku || "",
    unit: item.unit,
    minimumStock: Number(item.minimumStock),
    costPerUnit: Number(item.costPerUnit),
    isActive: item.isActive,
  };

  return <EditInventoryClient item={cleanItem} />;
}
