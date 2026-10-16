import { requirePermission } from "@/lib/permissions";
import NewItemClient from "./new-item-client";

export default async function NewInventoryItemPage() {
  await requirePermission("INVENTORY_MANAGE");
  
  return <NewItemClient />;
}
