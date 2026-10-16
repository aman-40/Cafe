import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AdjustClient from "./adjust-client";

export default async function AdjustInventoryPage(props: { params: Promise<{ id: string }> }) {
  await requirePermission("INVENTORY_MANAGE");

  const params = await props.params;
  const item = await prisma.inventoryItem.findUnique({
    where: { id: params.id }
  });

  if (!item) {
    notFound();
  }

  const cleanItem = {
    id: item.id,
    name: item.name,
    unit: item.unit,
    currentStock: Number(item.currentStock),
  };

  return <AdjustClient item={cleanItem} />;
}
