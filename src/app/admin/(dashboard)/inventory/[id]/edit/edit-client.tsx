"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { updateInventoryItem } from "../../actions";
import { UnitType } from "@prisma/client";

export default function EditInventoryClient({ item }: { item: { id: string; name: string; sku?: string; unit: UnitType; minimumStock: number; costPerUnit: number; isActive: boolean } }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const sku = formData.get("sku") as string;
    const unit = formData.get("unit") as UnitType;
    const minimumStock = Number(formData.get("minimumStock"));
    const costPerUnit = Number(formData.get("costPerUnit"));
    const isActive = formData.get("isActive") === "on";

    if (!name || !unit) {
      setError("Name and Unit are required.");
      setIsPending(false);
      return;
    }

    if (minimumStock < 0 || costPerUnit < 0) {
      setError("Stock and Cost values cannot be negative.");
      setIsPending(false);
      return;
    }

    const res = await updateInventoryItem(item.id, {
      name,
      sku: sku || undefined,
      unit,
      minimumStock,
      costPerUnit,
      isActive,
    });

    if (res.error) {
      setError(res.error);
      setIsPending(false);
    } else {
      router.push("/admin/inventory");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center">
        <Link href="/admin/inventory">
          <Button variant="ghost" size="sm" className="-ml-4 mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit {item.name}</h1>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input id="name" name="name" required defaultValue={item.name} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sku">SKU (Optional)</Label>
              <Input id="sku" name="sku" defaultValue={item.sku} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <select 
                id="unit" 
                name="unit" 
                required 
                defaultValue={item.unit}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="GRAM">Gram (g)</option>
                <option value="KILOGRAM">Kilogram (kg)</option>
                <option value="MILLILITER">Milliliter (ml)</option>
                <option value="LITER">Liter (L)</option>
                <option value="PIECE">Piece</option>
                <option value="PACK">Pack</option>
                <option value="BOTTLE">Bottle</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPerUnit">Cost Per Unit (₹)</Label>
              <Input id="costPerUnit" name="costPerUnit" type="number" step="0.01" min="0" defaultValue={item.costPerUnit} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minimumStock">Minimum Stock Alert Threshold</Label>
              <Input id="minimumStock" name="minimumStock" type="number" step="0.01" min="0" defaultValue={item.minimumStock} />
            </div>
          </div>

          <div className="flex items-center space-x-2 border-t pt-6">
            <input type="checkbox" id="isActive" name="isActive" defaultChecked={item.isActive} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
            <Label htmlFor="isActive" className="font-normal cursor-pointer">Active in inventory</Label>
          </div>

          <div className="flex justify-end pt-4 gap-4">
            <Link href="/admin/inventory">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
