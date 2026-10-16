import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { DateRangePicker } from "@/components/admin/date-range-picker";
import { DateRangeFilter, getDateRange } from "@/lib/analytics-utils";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Prisma } from "@prisma/client";

export default async function PaymentsReportPage(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  await requirePermission("PAYMENTS_VIEW");

  const searchParams = await props.searchParams;
  const range = (searchParams?.range as DateRangeFilter) || "TODAY";
  const filter = (searchParams?.filter as string) || "ALL";
  
  const { start, end } = getDateRange(range);

  const whereCondition: Prisma.PaymentWhereInput = { createdAt: { gte: start, lte: end } };
  if (filter !== "ALL") {
    whereCondition.status = filter as Prisma.EnumPaymentStatusFilter;
  }

  const payments = await prisma.payment.findMany({
    where: whereCondition,
    include: { order: true },
    orderBy: { createdAt: 'desc' }
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'PROCESSING': return 'bg-blue-100 text-blue-700';
      case 'FAILED': return 'bg-red-100 text-red-700';
      case 'REFUNDED': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const csvHeaders = "Payment ID,Order Number,Amount,Method,Status,Date\n";
  const csvRows = payments.map(p => `${p.id},${p.order.orderNumber},${p.amount},${p.method || 'UNKNOWN'},${p.status},${format(p.createdAt, 'yyyy-MM-dd HH:mm')}`).join("\n");
  const csvData = `data:text/csv;charset=utf-8,${encodeURIComponent(csvHeaders + csvRows)}`;

  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold font-serif text-gray-900">Payments Report</h1>
          <p className="text-muted-foreground mt-1">Transaction reconciliation</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker />
          <a href={csvData} download={`payments-${range}.csv`}>
            <Button variant="outline" size="icon" title="Export CSV">
              <Download className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['ALL', 'PAID', 'PENDING', 'FAILED', 'REFUNDED'].map(f => (
          <a key={f} href={`?range=${range}&filter=${f}`} className={`px-4 py-2 rounded-md text-sm font-medium ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-white border text-foreground'}`}>
            {f}
          </a>
        ))}
      </div>

      {filter === 'ALL' && (
        <Card className="mb-6 w-fit min-w-[250px]">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Collected Revenue in Period</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-700">₹{totalPaid.toLocaleString()}</div></CardContent>
        </Card>
      )}

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Payment ID</th>
              <th className="px-6 py-4">Order #</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Method</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  No payment data for this period.
                </td>
              </tr>
            ) : (
              payments.map(p => (
                <tr key={p.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 font-mono text-xs">{p.id}</td>
                  <td className="px-6 py-4 font-medium">{p.order.orderNumber}</td>
                  <td className="px-6 py-4 font-semibold">₹{Number(p.amount).toFixed(2)}</td>
                  <td className="px-6 py-4">{p.method || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{format(p.createdAt, 'MMM d, h:mm a')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
