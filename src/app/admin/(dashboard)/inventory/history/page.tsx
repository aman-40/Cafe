import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";

export const metadata = { title: "Inventory History | Admin" };

export default async function InventoryHistoryPage(props: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  await requirePermission("INVENTORY_VIEW");

  const searchParams = await props.searchParams;
  const filter = searchParams?.filter || "ALL";

  const whereCondition = filter !== "ALL" ? { type: filter as import("@prisma/client").TransactionType } : {};

  const history = await prisma.inventoryTransaction.findMany({
    where: whereCondition,
    include: {
      inventoryItem: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200, // Limit to recent 200 for simplicity
  });

  return (
    <div>
      <div className="flex items-center mb-6">
        <Link href="/admin/inventory">
          <Button variant="ghost" size="sm" className="-ml-4 mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Inventory
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-serif text-gray-900">Inventory History</h1>
          <p className="text-muted-foreground mt-1">Track all stock movements and adjustments.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["ALL", "PURCHASE", "SALE", "WASTE", "ADJUSTMENT", "RETURN"].map((f) => (
          <Link key={f} href={`/admin/inventory/history${f === "ALL" ? "" : `?filter=${f}`}`}>
            <Button variant={filter === f ? "default" : "outline"} size="sm" className="rounded-full">
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </Button>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Ingredient</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Movement</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No inventory transactions found.
                  </td>
                </tr>
              ) : (
                history.map((tx) => {
                  const qty = Number(tx.quantity);
                  const isPositive = qty > 0;
                  
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {format(new Date(tx.createdAt), "MMM d, yyyy h:mm a")}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {tx.inventoryItem.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-800">
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                          {isPositive ? "+" : ""}{qty} {tx.inventoryItem.unit}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {Number(tx.previousStock)} → {Number(tx.newStock)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {tx.reason || "-"}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs font-mono">
                        {tx.referenceId || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
