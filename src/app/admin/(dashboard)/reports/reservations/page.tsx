import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { DateRangePicker } from "@/components/admin/date-range-picker";
import { DateRangeFilter, getDateRange } from "@/lib/analytics-utils";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ReservationsReportPage(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  await requirePermission("REPORTS_VIEW");

  const searchParams = await props.searchParams;
  const range = (searchParams?.range as DateRangeFilter) || "TODAY";
  
  const { start, end } = getDateRange(range);

  const reservations = await prisma.reservation.findMany({
    where: { reservationDate: { gte: start, lte: end } },
    include: { table: true },
    orderBy: [{ reservationDate: 'desc' }, { startTime: 'desc' }]
  });

  const stats = {
    total: reservations.length,
    confirmed: reservations.filter(r => r.status === 'CONFIRMED' || r.status === 'SEATED').length,
    completed: reservations.filter(r => r.status === 'COMPLETED').length,
    cancelled: reservations.filter(r => r.status === 'CANCELLED' || r.status === 'REJECTED').length,
    noShow: reservations.filter(r => r.status === 'NO_SHOW').length
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-700';
      case 'SEATED': return 'bg-blue-100 text-blue-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'COMPLETED': return 'bg-gray-100 text-gray-700';
      default: return 'bg-red-100 text-red-700'; // Cancelled, Rejected, No-show
    }
  };

  const csvHeaders = "Reservation,Date,Time,Guests,Table,Status\n";
  const csvRows = reservations.map(r => `${r.reservationNumber},${format(r.reservationDate, 'yyyy-MM-dd')},${r.startTime},${r.guestCount},Table ${r.table.tableNumber},${r.status}`).join("\n");
  const csvData = `data:text/csv;charset=utf-8,${encodeURIComponent(csvHeaders + csvRows)}`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold font-serif text-gray-900">Reservations Report</h1>
          <p className="text-muted-foreground mt-1">Table utilization and bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker />
          <a href={csvData} download={`reservations-${range}.csv`}>
            <Button variant="outline" size="icon" title="Export CSV">
              <Download className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Confirmed/Seated</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold text-green-600">{stats.confirmed}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Completed</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold text-gray-600">{stats.completed}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Cancelled</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold text-red-600">{stats.cancelled}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">No-shows</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-bold text-red-800">{stats.noShow}</div></CardContent>
        </Card>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm mt-8">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Reservation #</th>
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4">Guests</th>
              <th className="px-6 py-4">Table</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reservations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  No reservations for this period.
                </td>
              </tr>
            ) : (
              reservations.map(r => (
                <tr key={r.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 font-mono font-medium">{r.reservationNumber}</td>
                  <td className="px-6 py-4">
                    <div>{format(r.reservationDate, 'MMM d, yyyy')}</div>
                    <div className="text-xs text-muted-foreground">{r.startTime}</div>
                  </td>
                  <td className="px-6 py-4">{r.guestCount}</td>
                  <td className="px-6 py-4 font-medium">Table {r.table.tableNumber}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
