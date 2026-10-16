"use client";

import { useTransition, useState, useRef } from "react";
import { MenuItem, MenuCategory, InventoryItem, MenuItemIngredient } from "@prisma/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createItem, updateItem } from "./actions";
import { addIngredient, removeIngredient } from "./recipe-actions";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Upload, X, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

type ItemWithIngredients = MenuItem & {
  ingredients?: (MenuItemIngredient & { inventoryItem: InventoryItem })[];
};

type ItemFormProps = {
  item?: ItemWithIngredients;
  categories: MenuCategory[];
  inventoryItems?: InventoryItem[];
};

export function ItemForm({ item, categories, inventoryItems = [] }: ItemFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const [imagePreview, setImagePreview] = useState<string | null>(item?.image || null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert("Please upload an image file");
        return;
      }
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setRemoveImage(false);
    }
  }

  function handleRemoveImage() {
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    if (removeImage) {
      formData.append("removeImage", "true");
    }

    startTransition(async () => {
      const res = item 
        ? await updateItem(item.id, formData)
        : await createItem(formData);
        
      if (res.error) {
        setError(res.error);
      } else {
        router.push("/admin/menu/items");
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/menu/items" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h2 className="text-2xl font-bold">{item ? "Edit Menu Item" : "New Menu Item"}</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md text-sm">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl border shadow-sm space-y-6">
        <div className="space-y-2">
          <Label>Item Image</Label>
          <div className="flex items-start gap-6">
            <div className="relative h-32 w-32 rounded-xl overflow-hidden bg-muted border flex shrink-0 items-center justify-center">
              {imagePreview ? (
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
              ) : (
                <div className="text-muted-foreground text-xs text-center p-2">No image</div>
              )}
            </div>
            <div className="space-y-3">
              <input 
                type="file" 
                id="image" 
                name="image" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageChange}
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> {imagePreview ? "Replace Image" : "Upload Image"}
              </Button>
              {imagePreview && (
                <Button type="button" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2" onClick={handleRemoveImage}>
                  <X className="mr-2 h-4 w-4" /> Remove
                </Button>
              )}
              <p className="text-xs text-muted-foreground">Supported formats: JPG, PNG, WEBP. Max size: 5MB.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input id="name" name="name" defaultValue={item?.name || ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category *</Label>
            <select 
              id="categoryId" 
              name="categoryId" 
              defaultValue={item?.categoryId || ""} 
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>Select a category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea 
            id="description" 
            name="description" 
            defaultValue={item?.description || ""} 
            maxLength={500}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="price">Price (₹) *</Label>
            <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={item ? Number(item.price) : ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayOrder">Display Order</Label>
            <Input id="displayOrder" name="displayOrder" type="number" defaultValue={item?.displayOrder || 0} required />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isAvailable" name="isAvailable" value="true" defaultChecked={item ? item.isAvailable : true} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
            <Label htmlFor="isAvailable" className="font-medium">Item is Available</Label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isFeatured" name="isFeatured" value="true" defaultChecked={item ? item.isFeatured : false} className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500" />
            <Label htmlFor="isFeatured" className="font-medium text-amber-700">Featured Item (Homepage)</Label>
          </div>
        </div>

        <div className="pt-4 flex gap-4">
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? "Saving..." : item ? "Update Item" : "Create Item"}
          </Button>
          <Link href="/admin/menu/items" className={buttonVariants({ variant: "outline", size: "lg", className: isPending ? "pointer-events-none opacity-50" : "" })}>
            Cancel
          </Link>
        </div>
      </form>

      {item && (
        <RecipeManager item={item} inventoryItems={inventoryItems} />
      )}
    </div>
  );
}

function RecipeManager({ item, inventoryItems }: { item: ItemWithIngredients, inventoryItems: InventoryItem[] }) {
  const [ingredientId, setIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAddIngredient(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!ingredientId || !quantity) {
      setError("Select an ingredient and enter a quantity.");
      return;
    }

    startTransition(async () => {
      const res = await addIngredient(item.id, ingredientId, Number(quantity));
      if (res.error) {
        setError(res.error);
      } else {
        setIngredientId("");
        setQuantity("");
      }
    });
  }

  function handleRemove(id: string) {
    if (!confirm("Remove this ingredient?")) return;
    startTransition(async () => {
      await removeIngredient(id, item.id);
    });
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl border shadow-sm space-y-6 mt-6">
      <div>
        <h3 className="text-xl font-bold">Ingredients / Recipe</h3>
        <p className="text-sm text-muted-foreground mt-1">Configure ingredients to automatically deduct from inventory when ordered.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {item.ingredients && item.ingredients.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Ingredient</th>
                <th className="px-4 py-3 font-medium text-gray-500">Quantity</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {item.ingredients.map(ing => (
                <tr key={ing.id}>
                  <td className="px-4 py-3 font-medium">{ing.inventoryItem.name}</td>
                  <td className="px-4 py-3">{Number(ing.quantity)} {ing.inventoryItem.unit}</td>
                  <td className="px-4 py-3 text-right">
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemove(ing.id)} disabled={isPending} className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground p-4 bg-gray-50 rounded-lg text-center border">
          This menu item has no ingredients configured. Add ingredients to enable automatic stock tracking.
        </div>
      )}

      <form onSubmit={handleAddIngredient} className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
        <div className="flex-1">
          <select 
            value={ingredientId} 
            onChange={e => setIngredientId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            disabled={isPending}
          >
            <option value="" disabled>Select Ingredient...</option>
            {inventoryItems.map(inv => (
              <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-32">
          <Input 
            type="number" 
            placeholder="Qty" 
            step="0.01" 
            min="0.01" 
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            disabled={isPending}
          />
        </div>
        <Button type="submit" disabled={isPending} variant="secondary">
          <Plus className="h-4 w-4 mr-2" /> Add
        </Button>
      </form>
    </div>
  );
}
