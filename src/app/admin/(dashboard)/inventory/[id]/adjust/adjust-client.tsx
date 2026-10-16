"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { adjustInventory } from "../../actions";
import { TransactionType } from "@prisma/client";

export default function AdjustClient({ item }: { item: { id: string; name: string; unit: string; currentStock: number } }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const [operation, setOperation] = useState<"ADD" | "SUBTRACT">("ADD");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));
    const type = formData.get("type") as TransactionType;
    const reason = formData.get("reason") as string;

    if (amount <= 0) {
      setError("Amount must be greater than zero.");
      setIsPending(false);
      return;
    }

    if (!reason) {
      setError("Please provide a reason for the adjustment.");
      setIsPending(false);
      return;
    }

    const quantity = operation === "ADD" ? amount : -amount;

    const res = await adjustInventory(item.id, {
      type,
      quantity,
      reason,
    });

    if (res.error) {
      setError(res.error);
      setIsPending(false);
    } else {
      router.push("/admin/inventory");
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6 flex items-center">
        <Link href="/admin/inventory">
          <Button variant="ghost" size="sm" className="-ml-4 mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Adjust Stock: {item.name}</h1>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
            {error}
          </div>
        )}

        <div className="mb-6 p-4 bg-gray-50 border rounded-lg text-center">
          <p className="text-sm text-muted-foreground mb-1">Current Stock</p>
          <div className="text-3xl font-bold">{item.currentStock} <span className="text-lg font-normal text-muted-foreground">{item.unit}</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div 
              onClick={() => setOperation("ADD")}
              className={`cursor-pointer p-4 rounded-xl border-2 text-center transition-colors ${operation === "ADD" ? "border-green-500 bg-green-50 text-green-700 font-bold" : "border-gray-200"}`}
            >
              + Add Stock
            </div>
            <div 
              onClick={() => setOperation("SUBTRACT")}
              className={`cursor-pointer p-4 rounded-xl border-2 text-center transition-colors ${operation === "SUBTRACT" ? "border-red-500 bg-red-50 text-red-700 font-bold" : "border-gray-200"}`}
            >
              - Remove Stock
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({item.unit}) *</Label>
            <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required placeholder="e.g. 5" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type *</Label>
            <select 
              id="type" 
              name="type" 
              required 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {operation === "ADD" ? (
                <>
                  <option value="PURCHASE">Purchase / Supplier Delivery</option>
                  <option value="RETURN">Return (from wastage/canceled order)</option>
                  <option value="ADJUSTMENT">Manual Adjustment (Correction)</option>
                </>
              ) : (
                <>
                  <option value="WASTE">Wastage / Spoilage</option>
                  <option value="RETURN">Return (to supplier)</option>
                  <option value="ADJUSTMENT">Manual Adjustment (Correction)</option>
                </>
              )}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Input id="reason" name="reason" required placeholder="e.g. New delivery from supplier" />
          </div>

          <div className="flex justify-end pt-4 gap-4">
            <Link href="/admin/inventory">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Processing..." : "Confirm Adjustment"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
