import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { DateRangePicker } from "@/components/admin/date-range-picker";
import { DateRangeFilter, getDateRange } from "@/lib/analytics-utils";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function WasteReportPage(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  await requirePermission("REPORTS_VIEW");

  const searchParams = await props.searchParams;
  const range = (searchParams?.range as DateRangeFilter) || "TODAY";
  
  const { start, end } = getDateRange(range);

  const wasteTransactions = await prisma.inventoryTransaction.findMany({
    where: { 
      type: 'WASTE',
      createdAt: { gte: start, lte: end } 
    },
    include: { inventoryItem: true },
    orderBy: { createdAt: 'desc' }
  });

  const totalWasteCost = wasteTransactions.reduce((sum, t) => {
    return sum + (Math.abs(Number(t.quantity)) * Number(t.inventoryItem.costPerUnit));
  }, 0);

  const csvHeaders = "Ingredient,Quantity,Unit,Estimated Cost,Reason,Date\n";
  const csvRows = wasteTransactions.map(t => {
    const qty = Math.abs(Number(t.quantity));
    const cost = qty * Number(t.inventoryItem.costPerUnit);
    return `"${t.inventoryItem.name}",${qty},${t.inventoryItem.unit},${cost.toFixed(2)},"${t.reason || ''}",${format(t.createdAt, 'yyyy-MM-dd')}`;
  }).join("\n");
  const csvData = `data:text/csv;charset=utf-8,${encodeURIComponent(csvHeaders + csvRows)}`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold font-serif text-gray-900">Waste Report</h1>
          <p className="text-muted-foreground mt-1">Spoilage and wasted ingredients</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker />
          <a href={csvData} download={`waste-${range}.csv`}>
            <Button variant="outline" size="icon" title="Export CSV">
              <Download className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>

      <Card className="mb-6 w-fit min-w-[250px]">
        <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Estimated Total Waste Cost</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold text-red-600">₹{totalWasteCost.toFixed(2)}</div></CardContent>
      </Card>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Ingredient</th>
              <th className="px-6 py-4">Quantity</th>
              <th className="px-6 py-4">Estimated Cost</th>
              <th className="px-6 py-4">Reason</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {wasteTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  No waste recorded for this period.
                </td>
              </tr>
            ) : (
              wasteTransactions.map(t => {
                const qty = Math.abs(Number(t.quantity));
                const cost = qty * Number(t.inventoryItem.costPerUnit);
                
                return (
                  <tr key={t.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 font-medium">{t.inventoryItem.name}</td>
                    <td className="px-6 py-4 text-red-600">{qty.toFixed(2)} {t.inventoryItem.unit}</td>
                    <td className="px-6 py-4 font-semibold text-gray-700">₹{cost.toFixed(2)}</td>
                    <td className="px-6 py-4">{t.reason || '—'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{format(t.createdAt, 'MMM d, yyyy h:mm a')}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
