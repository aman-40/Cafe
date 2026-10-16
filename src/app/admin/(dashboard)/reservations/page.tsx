import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { StatusActions } from "./status-actions";

export default async function AdminReservationsPage(
  props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  await requirePermission("RESERVATIONS_VIEW");

  const searchParams = await props.searchParams;
  const filter = typeof searchParams?.filter === 'string' ? searchParams.filter : 'TODAY';
  
  let dateFilter = {};
  if (filter === 'TODAY') {
    const start = new Date();
    start.setHours(0,0,0,0);
    dateFilter = { reservationDate: start };
  } else if (filter === 'UPCOMING') {
    const start = new Date();
    start.setHours(0,0,0,0);
    dateFilter = { reservationDate: { gt: start } };
  }

  const reservations = await prisma.reservation.findMany({
    where: { ...dateFilter },
    include: { table: true },
    orderBy: [
      { reservationDate: 'asc' },
      { startTime: 'asc' }
    ]
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif text-gray-900">Reservations</h1>
          <p className="text-muted-foreground mt-1">Manage table bookings and seating.</p>
        </div>
        <div className="flex gap-2">
          <a href="?filter=TODAY" className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'TODAY' ? 'bg-primary text-primary-foreground' : 'bg-white border text-foreground'}`}>Today</a>
          <a href="?filter=UPCOMING" className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'UPCOMING' ? 'bg-primary text-primary-foreground' : 'bg-white border text-foreground'}`}>Upcoming</a>
          <a href="?filter=ALL" className={`px-4 py-2 rounded-md text-sm font-medium ${filter === 'ALL' ? 'bg-primary text-primary-foreground' : 'bg-white border text-foreground'}`}>All</a>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Reservation</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Date & Time</th>
              <th className="px-6 py-4">Table / Guests</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reservations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  No reservations found.
                </td>
              </tr>
            ) : (
              reservations.map(res => (
                <tr key={res.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono font-medium text-primary">{res.reservationNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{res.customerName}</div>
                    <div className="text-xs text-muted-foreground">{res.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{format(res.reservationDate, 'MMM d, yyyy')}</div>
                    <div className="text-xs text-muted-foreground">{res.startTime}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">Table {res.table.tableNumber}</div>
                    <div className="text-xs text-muted-foreground">{res.guestCount} Guests</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium
                      ${res.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : ''}
                      ${res.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : ''}
                      ${res.status === 'SEATED' ? 'bg-blue-100 text-blue-700' : ''}
                      ${res.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700' : ''}
                      ${res.status === 'CANCELLED' || res.status === 'REJECTED' || res.status === 'NO_SHOW' ? 'bg-red-100 text-red-700' : ''}
                    `}>
                      {res.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusActions id={res.id} currentStatus={res.status} />
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
