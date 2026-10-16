import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { DateRangePicker } from "@/components/admin/date-range-picker";
import { DateRangeFilter, getDateRange } from "@/lib/analytics-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function InventoryReportPage(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  await requirePermission("REPORTS_VIEW");

  const searchParams = await props.searchParams;
  const range = (searchParams?.range as DateRangeFilter) || "TODAY";
  
  const { start, end } = getDateRange(range);

  const transactions = await prisma.inventoryTransaction.findMany({
    where: { createdAt: { gte: start, lte: end } },
    include: { inventoryItem: true },
    orderBy: { inventoryItem: { name: 'asc' } }
  });

  // Group by item
  const itemStats: Record<string, { name: string, unit: string, purchases: number, usage: number, waste: number, adjustments: number, currentStock: number }> = {};
  
  for (const t of transactions) {
    const id = t.inventoryItemId;
    if (!itemStats[id]) {
      itemStats[id] = {
        name: t.inventoryItem.name,
        unit: t.inventoryItem.unit,
        purchases: 0,
        usage: 0,
        waste: 0,
        adjustments: 0,
        currentStock: Number(t.inventoryItem.currentStock)
      };
    }

    const qty = Math.abs(Number(t.quantity));

    if (t.type === 'PURCHASE') itemStats[id].purchases += qty;
    else if (t.type === 'SALE') itemStats[id].usage += qty;
    else if (t.type === 'WASTE') itemStats[id].waste += qty;
    else if (t.type === 'ADJUSTMENT') itemStats[id].adjustments += Number(t.quantity); // preserve sign for adjustments
  }

  const items = Object.values(itemStats);

  const csvHeaders = "Ingredient,Purchases,Usage,Waste,Adjustments,Current Stock,Unit\n";
  const csvRows = items.map(i => `"${i.name}",${i.purchases},${i.usage},${i.waste},${i.adjustments},${i.currentStock},${i.unit}`).join("\n");
  const csvData = `data:text/csv;charset=utf-8,${encodeURIComponent(csvHeaders + csvRows)}`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold font-serif text-gray-900">Inventory Report</h1>
          <p className="text-muted-foreground mt-1">Ingredient usage and stock activity</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker />
          <a href={csvData} download={`inventory-${range}.csv`}>
            <Button variant="outline" size="icon" title="Export CSV">
              <Download className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Ingredient</th>
              <th className="px-6 py-4">Purchases</th>
              <th className="px-6 py-4">Usage</th>
              <th className="px-6 py-4">Waste</th>
              <th className="px-6 py-4">Adjustments</th>
              <th className="px-6 py-4">Current Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  No inventory activity for this period.
                </td>
              </tr>
            ) : (
              items.map((i, idx) => (
                <tr key={idx} className="hover:bg-muted/50">
                  <td className="px-6 py-4 font-medium">{i.name}</td>
                  <td className="px-6 py-4 text-green-600">{i.purchases.toFixed(2)} {i.unit}</td>
                  <td className="px-6 py-4 text-blue-600">{i.usage.toFixed(2)} {i.unit}</td>
                  <td className="px-6 py-4 text-red-600">{i.waste > 0 ? `${i.waste.toFixed(2)} ${i.unit}` : '-'}</td>
                  <td className="px-6 py-4">{i.adjustments !== 0 ? `${i.adjustments.toFixed(2)} ${i.unit}` : '-'}</td>
                  <td className="px-6 py-4 font-semibold">{i.currentStock.toFixed(2)} {i.unit}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
