import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { TableList } from "./table-list";

export const metadata = { title: "Manage Tables | Admin" };

export default async function TablesPage() {
  await requirePermission("TABLES_VIEW");

  const [tables, cafeSettings] = await Promise.all([
    prisma.cafeTable.findMany({ 
      orderBy: { tableNumber: 'asc' },
      include: {
        reservations: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED', 'SEATED'] },
            reservationDate: { gte: new Date(new Date().setHours(0,0,0,0)) }
          }
        }
      }
    }),
    prisma.cafeSettings.findFirst()
  ]);

  return <TableList tables={tables} cafeSettings={cafeSettings} />;
}
