"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Clock, Activity, AlertTriangle } from "lucide-react";
import { toggleStaffStatus } from "../actions";
import { Role } from "@prisma/client";

type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  position: string | null;
  permissions: string[];
  shifts: { id: string; startedAt: Date; endedAt: Date | null; status: string }[];
  activities: { id: string; action: string; details: string | null; createdAt: Date }[];
  createdAt: Date;
};

export function StaffDetailClient({ user, adminRole, adminId }: { user: StaffUser, adminRole: Role, adminId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDeactivate = user.id !== adminId && (user.role !== 'OWNER' || adminRole === 'OWNER');

  async function handleToggleStatus() {
    if (user.isActive && !confirm(`Are you sure you want to deactivate ${user.name}? They will lose access immediately.`)) {
      return;
    }
    
    setLoading(true);
    setError(null);
    const res = await toggleStaffStatus(user.id, !user.isActive);
    setLoading(false);
    
    if (res.error) {
      setError(res.error);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm font-medium flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2" /> {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-serif text-gray-900">{user.name}</h1>
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
              user.role === 'OWNER' ? 'bg-purple-100 text-purple-700' :
              user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {user.role}
            </span>
            {user.isActive ? (
              <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium">Active</span>
            ) : (
              <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-medium">Inactive</span>
            )}
          </div>
          <p className="text-muted-foreground mt-1">{user.email} • {user.position || 'No position specified'} • Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}</p>
        </div>
        
        {canDeactivate && (
          <Button 
            variant={user.isActive ? "destructive" : "default"} 
            onClick={handleToggleStatus} 
            disabled={loading}
          >
            {loading ? "Processing..." : (user.isActive ? "Deactivate Staff" : "Re-activate Staff")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
              Recent Shifts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.shifts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No shifts recorded.</p>
            ) : (
              <div className="space-y-4">
                {user.shifts.map((shift) => (
                  <div key={shift.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                    <div>
                      <div className="font-medium">{format(new Date(shift.startedAt), 'MMM d, yyyy')}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(shift.startedAt), 'h:mm a')} - {shift.endedAt ? format(new Date(shift.endedAt), 'h:mm a') : 'Present'}
                      </div>
                    </div>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium uppercase ${
                        shift.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {shift.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="w-4 h-4 mr-2 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity recorded.</p>
            ) : (
              <div className="space-y-3">
                {user.activities.map((activity) => (
                  <div key={activity.id} className="text-sm border-b pb-2 last:border-0">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-gray-800">{activity.action.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(activity.createdAt), 'MMM d, h:mm a')}</span>
                    </div>
                    {activity.details && (
                      <p className="text-xs text-muted-foreground mt-1">{activity.details}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
