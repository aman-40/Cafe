import { getAdminUser, getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logoutAction } from "../actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Coffee, LayoutDashboard, Settings, MenuSquare, Grid2x2, List, Package, CalendarDays, PieChart, TrendingUp, CreditCard, Calendar, Archive, Trash, Users, Clock, Activity } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  const adminUser = await getAdminUser();

  if (!adminUser) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-red-600 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">You do not have permission to view this page or your account is inactive.</p>
        <form action={logoutAction}>
          <Button type="submit">Log Out</Button>
        </form>
      </div>
    );
  }

  const cafe = await prisma.cafeSettings.findFirst();
  const cafeName = cafe?.name || "Café Management";

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-gray-50/50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 flex-shrink-0 bg-white border-r md:min-h-screen overflow-y-auto">
        <div className="flex h-16 items-center px-6 border-b">
          <Coffee className="mr-2 h-5 w-5 text-primary" />
          <span className="text-lg font-semibold tracking-tight">{cafeName}</span>
        </div>
        <div className="py-4">
          <nav className="space-y-1 px-3">
            <Link href="/admin" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100">
              <LayoutDashboard className="mr-3 h-4 w-4" />
              Dashboard
            </Link>
            
            {hasPermission(adminUser, "SETTINGS_VIEW") && (
              <>
                <Link href="/admin/settings" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                  <Settings className="mr-3 h-4 w-4" />
                  Café Settings
                </Link>
                {hasPermission(adminUser, "SETTINGS_MANAGE") && (
                  <Link href="/admin/settings/notifications" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 pl-8">
                    Notification Settings
                  </Link>
                )}
                <Link href="/admin/notifications" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 pl-8">
                  Notification Logs
                </Link>
              </>
            )}

            {hasPermission(adminUser, "MENU_VIEW") && (
              <>
                <div className="pt-4 pb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Menu
                </div>
                <Link href="/admin/menu/categories" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                  <Grid2x2 className="mr-3 h-4 w-4" />
                  Categories
                </Link>
                <Link href="/admin/menu/items" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                  <List className="mr-3 h-4 w-4" />
                  Items
                </Link>
              </>
            )}

            {(hasPermission(adminUser, "KITCHEN_VIEW") || hasPermission(adminUser, "ORDERS_VIEW") || hasPermission(adminUser, "TABLES_VIEW") || hasPermission(adminUser, "INVENTORY_VIEW") || hasPermission(adminUser, "RESERVATIONS_VIEW") || hasPermission(adminUser, "PAYMENTS_VIEW")) && (
              <div className="pt-4 pb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Restaurant
              </div>
            )}
            
            {hasPermission(adminUser, "KITCHEN_VIEW") && (
              <Link href="/admin/orders" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                <MenuSquare className="mr-3 h-4 w-4" />
                Kitchen Orders
              </Link>
            )}
            
            {hasPermission(adminUser, "ORDERS_VIEW") && (
              <Link href="/admin/orders/history" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                <List className="mr-3 h-4 w-4" />
                Order History
              </Link>
            )}
            
            {hasPermission(adminUser, "PAYMENTS_VIEW") && (
              <Link href="/admin/payments" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                <CreditCard className="mr-3 h-4 w-4" />
                Payments
              </Link>
            )}
            
            {hasPermission(adminUser, "TABLES_VIEW") && (
              <Link href="/admin/tables" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                <MenuSquare className="mr-3 h-4 w-4" />
                Tables
              </Link>
            )}
            
            {hasPermission(adminUser, "INVENTORY_VIEW") && (
              <Link href="/admin/inventory" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                <Package className="mr-3 h-4 w-4" />
                Inventory
              </Link>
            )}
            
            {hasPermission(adminUser, "RESERVATIONS_VIEW") && (
              <Link href="/admin/reservations" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                <CalendarDays className="mr-3 h-4 w-4" />
                Reservations
              </Link>
            )}

            {hasPermission(adminUser, "ANALYTICS_VIEW") && (
              <>
                <div className="pt-4 pb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Analytics & Reports
                </div>
                <Link href="/admin/analytics" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                  <PieChart className="mr-3 h-4 w-4" />
                  Dashboard
                </Link>
                {hasPermission(adminUser, "REPORTS_VIEW") && (
                  <>
                    <Link href="/admin/reports/sales" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 pl-8">
                      <TrendingUp className="mr-3 h-4 w-4" />
                      Sales
                    </Link>
                    {hasPermission(adminUser, "PAYMENTS_VIEW") && (
                      <Link href="/admin/reports/payments" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 pl-8">
                        <CreditCard className="mr-3 h-4 w-4" />
                        Payments
                      </Link>
                    )}
                    {hasPermission(adminUser, "RESERVATIONS_VIEW") && (
                      <Link href="/admin/reports/reservations" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 pl-8">
                        <Calendar className="mr-3 h-4 w-4" />
                        Reservations
                      </Link>
                    )}
                    {hasPermission(adminUser, "INVENTORY_VIEW") && (
                      <>
                        <Link href="/admin/reports/inventory" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 pl-8">
                          <Archive className="mr-3 h-4 w-4" />
                          Inventory
                        </Link>
                        <Link href="/admin/reports/waste" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 pl-8">
                          <Trash className="mr-3 h-4 w-4" />
                          Waste
                        </Link>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {hasPermission(adminUser, "STAFF_VIEW") && (
              <>
                <div className="pt-4 pb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Staff
                </div>
                <Link href="/admin/staff" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                  <Users className="mr-3 h-4 w-4" />
                  Staff Members
                </Link>
                <Link href="/admin/staff/shifts" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                  <Clock className="mr-3 h-4 w-4" />
                  Shifts
                </Link>
                <Link href="/admin/staff/activity" className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                  <Activity className="mr-3 h-4 w-4" />
                  Activity Log
                </Link>
              </>
            )}

          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <div className="flex-1">
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
              adminUser.role === 'OWNER' ? 'bg-purple-100 text-purple-700' :
              adminUser.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {adminUser.role}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium leading-none">{adminUser.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{adminUser.position || adminUser.role}</p>
            </div>
            <form action={logoutAction}>
              <Button variant="outline" size="sm" type="submit">Log out</Button>
            </form>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
