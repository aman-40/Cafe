"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Role } from "@prisma/client";
import { createStaff, updateStaff } from "../actions";
import { PERMISSIONS } from "@/lib/permissions-constants";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

type StaffFormProps = {
  adminRole: Role;
  initialData?: {
    id: string;
    name: string;
    email: string;
    role: Role;
    position: string | null;
    permissions: string[];
  };
};

export function StaffForm({ adminRole, initialData }: StaffFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    role: initialData?.role || "STAFF",
    position: initialData?.position || "",
    permissions: initialData?.permissions || [],
  });

  const handlePermissionChange = (perm: string) => {
    setFormData(prev => {
      const perms = new Set(prev.permissions);
      if (perms.has(perm)) {
        perms.delete(perm);
      } else {
        perms.add(perm);
      }
      return { ...prev, permissions: Array.from(perms) };
    });
  };

  const applyPreset = (preset: string[]) => {
    setFormData(prev => ({ ...prev, permissions: preset }));
  };

  const PRESETS = {
    "Kitchen Staff": ["ORDERS_VIEW", "KITCHEN_VIEW", "KITCHEN_MANAGE"],
    "Cashier": ["ORDERS_VIEW", "PAYMENTS_VIEW", "PAYMENTS_MANAGE", "TABLES_VIEW"],
    "Inventory Manager": ["INVENTORY_VIEW", "INVENTORY_MANAGE"],
    "Host": ["RESERVATIONS_VIEW", "RESERVATIONS_MANAGE", "TABLES_VIEW"],
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = initialData 
      ? await updateStaff(initialData.id, {
          name: formData.name,
          role: formData.role,
          position: formData.position,
          permissions: formData.permissions
        })
      : await createStaff({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          position: formData.position,
          permissions: formData.permissions
        });

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      router.push("/admin/staff");
    }
  }

  // Prevent admin from creating Owner/Admin unless they are Owner
  const availableRoles = adminRole === "OWNER" 
    ? ["OWNER", "ADMIN", "STAFF"] 
    : (initialData?.role === "ADMIN" ? ["ADMIN", "STAFF"] : ["STAFF"]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Rahul Sharma" />
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" required disabled={!!initialData} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="staff@example.com" />
            {!initialData && <p className="text-xs text-muted-foreground mt-1">This email will be used for Supabase Auth invitation.</p>}
          </div>

          <div>
            <Label htmlFor="position">Position / Job Title</Label>
            <Input id="position" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} placeholder="e.g. Head Chef" />
          </div>

          <div>
            <Label htmlFor="role">System Role</Label>
            <select 
              id="role"
              value={formData.role} 
              onChange={e => setFormData({...formData, role: e.target.value as Role})}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {availableRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          {formData.role === "STAFF" ? (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-sm flex items-center"><Shield className="w-4 h-4 mr-2" /> Granular Permissions</h3>
                  <p className="text-xs text-muted-foreground mt-1">Select exactly which modules this staff member can access.</p>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-xs font-medium py-1">Presets:</span>
                  {Object.entries(PRESETS).map(([name, perms]) => (
                    <button type="button" key={name} onClick={() => applyPreset(perms)} className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full text-gray-700">
                      {name}
                    </button>
                  ))}
                  <button type="button" onClick={() => setFormData({...formData, permissions: []})} className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded-full ml-auto">
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-y-2 gap-x-4 pt-4 border-t max-h-[300px] overflow-y-auto">
                  {PERMISSIONS.map(perm => (
                    <Label key={perm} className="flex items-center space-x-2 font-normal text-xs cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.permissions.includes(perm)}
                        onChange={() => handlePermissionChange(perm)}
                        className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span>{perm.replace('_', ' ')}</span>
                    </Label>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gray-50 border-dashed">
              <CardContent className="p-6 text-center text-gray-500">
                <Shield className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">{formData.role} Role Selected</p>
                <p className="text-xs mt-1">
                  {formData.role === "OWNER" 
                    ? "Owners have unrestricted access to all modules including sensitive settings." 
                    : "Admins have full operational access to all modules, excluding sensitive owner settings."}
                </p>
                <p className="text-xs mt-4">Granular permissions are ignored for this role.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : initialData ? "Update Staff" : "Create Staff"}
        </Button>
      </div>
    </form>
  );
}
