"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { format } from "date-fns";

type Activity = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: string | null;
  createdAt: Date;
  user: { name: string; role: string };
};

export function ActivityList({ initialActivities }: { initialActivities: Activity[] }) {
  const [search, setSearch] = useState("");

  const filtered = initialActivities.filter(a => {
    const s = search.toLowerCase();
    return a.user.name.toLowerCase().includes(s) || 
           a.action.toLowerCase().includes(s) || 
           (a.details && a.details.toLowerCase().includes(s));
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by user, action, or details..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Details</th>
              <th className="px-6 py-4">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                  No activity found.
                </td>
              </tr>
            ) : (
              filtered.map((activity) => (
                <tr key={activity.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                    {format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {activity.user.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium border">
                      {activity.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {activity.details || '—'}
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                    {activity.entityType ? `${activity.entityType} (${activity.entityId?.substring(0, 8)}...)` : '—'}
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
