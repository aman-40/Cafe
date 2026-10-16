import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { DateRangePicker } from "@/components/admin/date-range-picker";
import { DateRangeFilter, getDateRange, getPreviousDateRange, calculatePercentageChange } from "@/lib/analytics-utils";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Receipt, Users, ArrowUpRight, ArrowDownRight, PackageMinus } from "lucide-react";
import Link from "next/link";
import { Order, Payment } from "@prisma/client";

export default async function AnalyticsDashboard(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  await requirePermission("ANALYTICS_VIEW");

  const searchParams = await props.searchParams;
  const range = (searchParams?.range as DateRangeFilter) || "TODAY";
  
  const { start, end } = getDateRange(range);
  const prevRange = getPreviousDateRange(range, start, end);

  // Queries
  const [currentOrders, prevOrders, currentReservations, inventoryUsage, topItemsData] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { payments: true }
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: prevRange.start, lte: prevRange.end } },
      include: { payments: true }
    }),
    prisma.reservation.findMany({
      where: { createdAt: { gte: start, lte: end } }
    }),
    prisma.inventoryTransaction.findMany({
      where: { 
        type: 'SALE',
        createdAt: { gte: start, lte: end } 
      },
      include: { inventoryItem: true }
    }),
    prisma.orderItem.groupBy({
      by: ['name'],
      where: { 
        createdAt: { gte: start, lte: end },
        order: { payments: { some: { status: 'PAID' } } }
      },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    })
  ]);

  // Aggregate Data
  const getPaidRevenue = (orders: (Order & { payments: Payment[] })[]) => {
    let revenue = 0;
    let paidCount = 0;
    for (const order of orders) {
      if (order.status === "CANCELLED") continue;
      const hasPaid = order.payments.some((p: Payment) => p.status === 'PAID');
      if (hasPaid) {
        revenue += Number(order.total);
        paidCount++;
      }
    }
    return { revenue, paidCount };
  };

  const currentStats = getPaidRevenue(currentOrders);
  const prevStats = getPaidRevenue(prevOrders);

  const aov = currentStats.paidCount > 0 ? currentStats.revenue / currentStats.paidCount : null;
  const revenueChange = calculatePercentageChange(currentStats.revenue, prevStats.revenue);

  // Top Items
  const topItems = topItemsData.map(t => ({
    name: t.name,
    quantity: t._sum.quantity || 0,
    revenue: Number(t._sum.subtotal || 0)
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-gray-900">Analytics</h1>
          <p className="text-muted-foreground mt-1">Operational and financial overview</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker />
          <p className="text-xs text-muted-foreground whitespace-nowrap hidden md:block">
            {format(start, 'MMM d')} - {format(end, 'MMM d, yyyy')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{currentStats.revenue.toLocaleString()}</div>
            {revenueChange !== null ? (
              <p className={`text-xs mt-1 flex items-center ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {revenueChange >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {Math.abs(revenueChange).toFixed(1)}% from previous
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">New activity</p>
            )}
          </CardContent>
        </Card>

        {/* Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid Orders</CardTitle>
            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.paidCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of {currentOrders.length} total orders</p>
          </CardContent>
        </Card>

        {/* AOV */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Order Value</CardTitle>
            <Receipt className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aov !== null ? `₹${aov.toFixed(0)}` : '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">Based on paid orders</p>
          </CardContent>
        </Card>

        {/* Reservations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reservations</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentReservations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentReservations.filter(r => r.status === 'CONFIRMED' || r.status === 'SEATED' || r.status === 'COMPLETED').length} confirmed/seated
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            {topItems.length > 0 ? (
              <div className="space-y-4">
                {topItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <span className="font-medium">{index + 1}. {item.name}</span>
                    <div className="text-right">
                      <div className="font-medium">{item.quantity} sold</div>
                      <div className="text-xs text-muted-foreground">₹{item.revenue.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No menu item sales for this period.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Consumption</CardTitle>
          </CardHeader>
          <CardContent>
            {inventoryUsage.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(
                  inventoryUsage.reduce((acc, curr) => {
                    const id = curr.inventoryItem.name;
                    if (!acc[id]) acc[id] = { name: id, qty: 0, unit: curr.inventoryItem.unit };
                    // SALE transactions are recorded with negative quantity for deduction, we want positive usage
                    acc[id].qty += Math.abs(Number(curr.quantity));
                    return acc;
                  }, {} as Record<string, {name: string, qty: number, unit: string}>)
                )
                .sort((a, b) => b[1].qty - a[1].qty)
                .slice(0, 5)
                .map(([, item], index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <span className="font-medium flex items-center">
                      <PackageMinus className="w-4 h-4 mr-2 text-muted-foreground" />
                      {item.name}
                    </span>
                    <span className="font-medium">{item.qty.toFixed(2)} {item.unit}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No inventory activity for this period.</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="pt-4 border-t">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Detailed Reports</h3>
        <div className="flex flex-wrap gap-4">
          <Link href={`/admin/reports/sales?range=${range}`} className="text-primary hover:underline font-medium">Sales Report &rarr;</Link>
          <Link href={`/admin/reports/payments?range=${range}`} className="text-primary hover:underline font-medium">Payments Report &rarr;</Link>
          <Link href={`/admin/reports/reservations?range=${range}`} className="text-primary hover:underline font-medium">Reservations Report &rarr;</Link>
          <Link href={`/admin/reports/inventory?range=${range}`} className="text-primary hover:underline font-medium">Inventory & Waste &rarr;</Link>
        </div>
      </div>
    </div>
  );
}
