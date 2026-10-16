import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Grid2x2, List, MenuSquare } from "lucide-react";

export default async function AdminDashboard() {
  const [
    categoryCount,
    itemCount,
    activeItemCount,
    tableCount,
    activeTableCount,
    cafeSettings,
  ] = await Promise.all([
    prisma.menuCategory.count(),
    prisma.menuItem.count(),
    prisma.menuItem.count({ where: { isAvailable: true } }),
    prisma.cafeTable.count(),
    prisma.cafeTable.count({ where: { isActive: true } }),
    prisma.cafeSettings.findFirst(),
  ]);

  const cafeName = cafeSettings?.name || "Your Café";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back to {cafeName} admin panel.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Grid2x2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Total menu categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{itemCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeItemCount} active items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tables</CardTitle>
            <MenuSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tableCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeTableCount} active tables
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
