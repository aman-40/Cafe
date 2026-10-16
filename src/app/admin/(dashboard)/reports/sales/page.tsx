import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { DateRangePicker } from "@/components/admin/date-range-picker";
import { DateRangeFilter, getDateRange } from "@/lib/analytics-utils";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Payment } from "@prisma/client";

export default async function SalesReportPage(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  await requirePermission("REPORTS_VIEW");

  const searchParams = await props.searchParams;
  const range = (searchParams?.range as DateRangeFilter) || "TODAY";
  
  const { start, end } = getDateRange(range);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lte: end } },
    include: { payments: true },
    orderBy: { createdAt: 'desc' }
  });

  const getPaidStats = () => {
    let revenue = 0;
    let paidOrders = 0;
    let cashRevenue = 0;
    let onlineRevenue = 0;

    for (const order of orders) {
      if (order.status === "CANCELLED") continue;
      
      const successfulPayments = order.payments.filter((p: Payment) => p.status === 'PAID');
      if (successfulPayments.length > 0) {
        const orderTotal = Number(order.total);
        revenue += orderTotal;
        paidOrders++;

        for (const p of successfulPayments) {
          if (p.method === 'CASH') {
            cashRevenue += Number(p.amount);
          } else {
            onlineRevenue += Number(p.amount);
          }
        }
      }
    }
    return { revenue, paidOrders, cashRevenue, onlineRevenue };
  };

  const stats = getPaidStats();
  const aov = stats.paidOrders > 0 ? stats.revenue / stats.paidOrders : null;

  // Group by date for the table
  const dailyData: Record<string, { orders: number, revenue: number }> = {};
  for (const order of orders) {
    if (order.status === "CANCELLED") continue;
    
    const dateKey = format(order.createdAt, 'yyyy-MM-dd');
    if (!dailyData[dateKey]) dailyData[dateKey] = { orders: 0, revenue: 0 };
    
    if (order.payments.some((p: Payment) => p.status === 'PAID')) {
      dailyData[dateKey].orders++;
      dailyData[dateKey].revenue += Number(order.total);
    }
  }

  const sortedDays = Object.keys(dailyData).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Generate CSV data for export
  const csvHeaders = "Date,Orders,Revenue\n";
  const csvRows = sortedDays.map(d => `${d},${dailyData[d].orders},${dailyData[d].revenue.toFixed(2)}`).join("\n");
  const csvData = `data:text/csv;charset=utf-8,${encodeURIComponent(csvHeaders + csvRows)}`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold font-serif text-gray-900">Sales Report</h1>
          <p className="text-muted-foreground mt-1">Detailed revenue and order metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker />
          <a href={csvData} download={`sales-report-${range}.csv`}>
            <Button variant="outline" size="icon" title="Export CSV">
              <Download className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Orders</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold">{orders.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Paid Orders</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold text-green-600">{stats.paidOrders}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Revenue</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold text-primary">₹{stats.revenue.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Avg Order Value</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold">{aov !== null ? `₹${aov.toFixed(0)}` : '—'}</div></CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Payment Split</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm font-medium">Online: ₹{stats.onlineRevenue.toLocaleString()}</div>
            <div className="text-sm font-medium">Cash: ₹{stats.cashRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm mt-8">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Paid Orders</th>
              <th className="px-6 py-4">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedDays.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">
                  No sales data for this period.
                </td>
              </tr>
            ) : (
              sortedDays.map(day => (
                <tr key={day} className="hover:bg-muted/50">
                  <td className="px-6 py-4 font-medium">{format(new Date(day), 'd MMM yyyy')}</td>
                  <td className="px-6 py-4">{dailyData[day].orders}</td>
                  <td className="px-6 py-4 font-semibold text-green-700">₹{dailyData[day].revenue.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
