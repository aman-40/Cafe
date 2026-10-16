import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Package, AlertTriangle, XCircle, Settings2 } from "lucide-react";
import { format } from "date-fns";

export const metadata = { title: "Inventory | Admin" };

export default async function InventoryPage() {
  await requirePermission("INVENTORY_VIEW");

  const items = await prisma.inventoryItem.findMany({
    orderBy: { name: "asc" }
  });

  const totalItems = items.length;
  const lowStockItems = items.filter(i => i.isActive && Number(i.currentStock) <= Number(i.minimumStock) && Number(i.currentStock) > 0);
  const outOfStockItems = items.filter(i => i.isActive && Number(i.currentStock) <= 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-gray-900">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage your café&apos;s raw materials and ingredients.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/inventory/history">
            <Button variant="outline"><Settings2 className="mr-2 h-4 w-4" /> History</Button>
          </Link>
          <Link href="/admin/inventory/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Add Item</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Items</p>
            <h3 className="text-2xl font-bold mt-1">{totalItems}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-start gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Low Stock</p>
            <h3 className="text-2xl font-bold mt-1">{lowStockItems.length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-start gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Out of Stock</p>
            <h3 className="text-2xl font-bold mt-1">{outOfStockItems.length}</h3>
          </div>
        </div>
      </div>

      {outOfStockItems.length > 0 && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
          <h3 className="text-red-800 font-bold flex items-center mb-2"><XCircle className="w-5 h-5 mr-2" /> Out of Stock Alerts</h3>
          <ul className="list-disc list-inside text-red-700 text-sm space-y-1 ml-1">
            {outOfStockItems.map(item => (
              <li key={item.id}><strong>{item.name}</strong> is out of stock.</li>
            ))}
          </ul>
        </div>
      )}

      {lowStockItems.length > 0 && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <h3 className="text-amber-800 font-bold flex items-center mb-2"><AlertTriangle className="w-5 h-5 mr-2" /> Low Stock Alerts</h3>
          <ul className="list-disc list-inside text-amber-700 text-sm space-y-1 ml-1">
            {lowStockItems.map(item => (
              <li key={item.id}>
                <strong>{item.name}</strong> has {Number(item.currentStock)} {item.unit} remaining (Minimum: {Number(item.minimumStock)} {item.unit})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Ingredient / SKU</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Minimum</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No inventory items found. Add your first ingredient to start tracking stock.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const currentStock = Number(item.currentStock);
                  const minStock = Number(item.minimumStock);
                  
                  let status = "Healthy";
                  let statusColor = "bg-green-100 text-green-800";
                  
                  if (!item.isActive) {
                    status = "Inactive";
                    statusColor = "bg-gray-100 text-gray-800";
                  } else if (currentStock <= 0) {
                    status = "Out of Stock";
                    statusColor = "bg-red-100 text-red-800";
                  } else if (currentStock <= minStock) {
                    status = "Low Stock";
                    statusColor = "bg-amber-100 text-amber-800";
                  }

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        {item.sku && <div className="text-xs text-muted-foreground">{item.sku}</div>}
                      </td>
                      <td className="px-6 py-4 font-bold">
                        {currentStock} <span className="text-xs font-normal text-muted-foreground">{item.unit}</span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {minStock} <span className="text-xs">{item.unit}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${statusColor}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link href={`/admin/inventory/${item.id}/adjust`}>
                          <Button variant="outline" size="sm">Adjust</Button>
                        </Link>
                        <Link href={`/admin/inventory/${item.id}/edit`}>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
