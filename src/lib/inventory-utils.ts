import { MenuItem, MenuItemIngredient, InventoryItem } from "@prisma/client";

type ItemWithIngredients = MenuItem & {
  ingredients?: (MenuItemIngredient & { inventoryItem: InventoryItem })[];
};

export function withEffectiveAvailability<T extends ItemWithIngredients>(items: T[]): T[] {
  return items.map(item => {
    let effectiveAvailable = item.isAvailable;
    if (effectiveAvailable && item.ingredients) {
      for (const ingredient of item.ingredients) {
        if (Number(ingredient.inventoryItem.currentStock) < Number(ingredient.quantity)) {
          effectiveAvailable = false;
          break;
        }
      }
    }
    return { ...item, isAvailable: effectiveAvailable };
  });
}

export function getEffectiveAvailability(item: ItemWithIngredients): boolean {
  let effectiveAvailable = item.isAvailable;
  if (effectiveAvailable && item.ingredients) {
    for (const ingredient of item.ingredients) {
      if (Number(ingredient.inventoryItem.currentStock) < Number(ingredient.quantity)) {
        effectiveAvailable = false;
        break;
      }
    }
  }
  return effectiveAvailable;
}
