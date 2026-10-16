"use client";

import { useTransition, useState, useEffect } from "react";
import { CafeTable, CafeSettings } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTable, updateTable, toggleTableStatus, deleteTable } from "./actions";
import { Pencil, Trash2, Plus, AlertTriangle, QrCode, Download, Printer } from "lucide-react";
import QRCode from "qrcode";

type TableWithQR = CafeTable & {
  qrCodeUrl?: string;
  reservations?: { status: string; customerName: string; startTime: string; endTime: string }[];
};

type TableListProps = {
  tables: TableWithQR[];
  cafeSettings: CafeSettings | null;
};

export function TableList({ tables, cafeSettings }: TableListProps) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState<CafeTable | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [qrModalTable, setQrModalTable] = useState<CafeTable | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createTable(formData);
      if (res.error) setError(res.error);
      else setIsAdding(false);
    });
  }

  function handleUpdate(formData: FormData) {
    if (!isEditing) return;
    setError(null);
    startTransition(async () => {
      const res = await updateTable(isEditing.id, formData);
      if (res.error) setError(res.error);
      else setIsEditing(null);
    });
  }

  function handleToggle(id: string, currentStatus: boolean) {
    startTransition(async () => {
      await toggleTableStatus(id, currentStatus);
    });
  }

  function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this table?")) {
      startTransition(async () => {
        const res = await deleteTable(id);
        if (res.error) alert(res.error);
      });
    }
  }

  async function openQRModal(table: CafeTable) {
    const url = `${siteUrl}/menu?table=${table.tableNumber}`;
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: '#3e2723', // Cafe brown
          light: '#ffffff'
        }
      });
      setQrDataUrl(dataUrl);
      setQrModalTable(table);
    } catch (err) {
      console.error("QR Generation failed", err);
      alert("Failed to generate QR code");
    }
  }

  function downloadQR() {
    if (!qrDataUrl || !qrModalTable) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `table-${qrModalTable.tableNumber}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function printQR() {
    if (!qrDataUrl || !qrModalTable) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code - Table ${qrModalTable.tableNumber}</title>
            <style>
              body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #fff; }
              .card { border: 2px solid #3e2723; padding: 40px; border-radius: 20px; text-align: center; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
              h1 { color: #3e2723; margin-top: 0; font-size: 28px; }
              p { color: #555; margin-bottom: 30px; font-size: 18px; }
              img { width: 100%; max-width: 300px; height: auto; }
              .table-num { margin-top: 30px; font-size: 32px; font-weight: bold; color: #3e2723; background: #f9f6f0; padding: 10px 20px; border-radius: 10px; display: inline-block; }
              .footer { margin-top: 20px; color: #888; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>${cafeSettings?.name || 'Premium Café'}</h1>
              <p>Scan to view our digital menu</p>
              <img src="${qrDataUrl}" alt="QR Code" />
              <div class="table-num">TABLE ${qrModalTable.tableNumber}</div>
              <div class="footer">Scan • Browse • Enjoy</div>
            </div>
            <script>
              window.onload = () => { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tables & QR Codes</h2>
          <p className="text-muted-foreground text-sm">Manage tables and generate digital menu QR codes.</p>
        </div>
        <Button onClick={() => { setIsAdding(true); setIsEditing(null); setError(null); }} disabled={isAdding}>
          <Plus className="mr-2 h-4 w-4" /> Add Table
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2" /> {error}
        </div>
      )}

      {(isAdding || isEditing) && (
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-4">{isEditing ? "Edit Table" : "New Table"}</h3>
          <form action={isEditing ? handleUpdate : handleCreate} className="space-y-4 max-w-md">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tableNumber">Table Number</Label>
                <Input id="tableNumber" name="tableNumber" type="text" defaultValue={isEditing?.tableNumber || ""} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (Seats)</Label>
                <Input id="capacity" name="capacity" type="number" min="1" defaultValue={isEditing?.capacity || 2} required />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" id="isActive" name="isActive" value="true" defaultChecked={isEditing ? isEditing.isActive : true} className="w-4 h-4 rounded border-gray-300 text-primary" />
              <Label htmlFor="isActive">Table is active</Label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Table"}</Button>
              <Button type="button" variant="outline" onClick={() => { setIsAdding(false); setIsEditing(null); }} disabled={isPending}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {!isAdding && !isEditing && tables.length === 0 && (
        <div className="text-center p-12 border rounded-xl bg-white">
          <p className="text-muted-foreground mb-4">No café tables configured.</p>
          <Button onClick={() => setIsAdding(true)}>Add your first table</Button>
        </div>
      )}

      {tables.length > 0 && !isAdding && !isEditing && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Table</th>
                <th className="px-6 py-4">Capacity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">QR Code</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tables.map(table => (
                <tr key={table.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-bold text-base">Table {table.tableNumber}</td>
                  <td className="px-6 py-4">{table.capacity} seats</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleToggle(table.id, table.isActive)}
                        disabled={isPending}
                        className={`px-2.5 py-1 text-xs font-medium rounded-full ${table.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {table.isActive ? "Active" : "Inactive"}
                      </button>
                      
                      {table.reservations?.some(r => r.status === "SEATED") && (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                          Seated
                        </span>
                      )}
                      
                      {table.reservations?.some(r => r.status === "CONFIRMED") && !table.reservations?.some(r => r.status === "SEATED") && (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                          Reserved
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="outline" size="sm" onClick={() => openQRModal(table)} disabled={!table.isActive}>
                      <QrCode className="mr-2 h-4 w-4" /> Generate QR
                    </Button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(table)} disabled={isPending}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(table.id)} disabled={isPending}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* QR Modal Overlay */}
      {qrModalTable && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-xl">
            <h3 className="text-2xl font-bold mb-2">Table {qrModalTable.tableNumber}</h3>
            <p className="text-muted-foreground text-sm mb-6">Scan this code to view the digital menu for this table.</p>
            
            <div className="bg-gray-50 p-4 rounded-xl inline-block mb-6 border">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt={`QR Code for Table ${qrModalTable.tableNumber}`} className="w-48 h-48 mx-auto" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-lg">Generating...</div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Button variant="outline" onClick={downloadQR} disabled={!qrDataUrl}>
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
              <Button variant="outline" onClick={printQR} disabled={!qrDataUrl}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
            </div>
            <Button className="w-full" variant="ghost" onClick={() => setQrModalTable(null)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
