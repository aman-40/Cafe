"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Role } from "@prisma/client";

type UserWithDetails = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  position: string | null;
  shifts: { status: string; startedAt: Date }[];
  activities: { createdAt: Date; action: string }[];
  createdAt: Date;
};

export function StaffList({ initialUsers }: { initialUsers: UserWithDetails[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredUsers = initialUsers.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) || 
                          user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || 
                          (statusFilter === "ACTIVE" ? user.isActive : !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search staff..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="ALL">All Roles</option>
            <option value="OWNER">Owner</option>
            <option value="ADMIN">Admin</option>
            <option value="STAFF">Staff</option>
          </select>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Current Shift</th>
              <th className="px-6 py-4">Last Activity</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  No staff members found matching criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'OWNER' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role}
                    </span>
                    {user.position && <div className="text-xs text-muted-foreground mt-1">{user.position}</div>}
                  </td>
                  <td className="px-6 py-4">
                    {user.isActive ? (
                      <span className="text-green-600 font-medium text-xs flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-2"></span> Active
                      </span>
                    ) : (
                      <span className="text-gray-500 font-medium text-xs flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2"></span> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.shifts.length > 0 ? (
                      <span className="text-blue-600 font-medium text-xs">On Shift (Since {format(new Date(user.shifts[0].startedAt), 'h:mm a')})</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {user.activities.length > 0 ? (
                      <div>
                        {format(new Date(user.activities[0].createdAt), 'MMM d, h:mm a')}
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/staff/${user.id}`} className="text-primary hover:underline font-medium text-sm">
                      Manage
                    </Link>
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
