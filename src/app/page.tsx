"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useClient } from "@/context/client-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Admin Dashboard Component - Shows THEIR assigned clients
function AdminDashboard({ role, userId }: { role: string; userId: string }) {
  const { clients, stats, loading, getAllClients } = useClient();
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Load admin's clients on mount (ONLY for ADMIN role)
  useEffect(() => {
    if (role === "ADMIN") {
      getAllClients();
    }
  }, [role]);


  // Filter clients by status
  const filteredClients = clients.filter((client) => {
    if (!filterStatus) return true;
    if (filterStatus === "ACTIVE") return client.status === "ACTIVE";
    if (filterStatus === "INACTIVE") return client.status === "INACTIVE";
    if (filterStatus === "PENDING") return client.pendingWork > 0;
    if (filterStatus === "COMPLETED") return client.pendingWork === 0 && client.completedWork > 0;
    return true;
  });

  // Calculate KPI stats from context stats or local data
  const kpiStats = {
    totalClients: stats?.totalClients || clients.length,
    activeClients: stats?.activeClients || clients.filter((c) => c.status === "ACTIVE").length,
    totalPendingWork: stats?.totalPendingWork || clients.reduce((sum, c) => sum + c.pendingWork, 0),
    totalCompletedWork: stats?.totalCompletedWork || clients.reduce((sum, c) => sum + c.completedWork, 0),
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading && role === "ADMIN") {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }


  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {role === "ADMIN" ? "My Clients Dashboard" : "Dashboard"}
          </h1>
          <p className="text-slate-500 mt-1">
            {role === "ADMIN"
              ? `Managing ${kpiStats.totalClients} client${kpiStats.totalClients !== 1 ? 's' : ''}`
              : "Your service overview"}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setFilterStatus(null)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiStats.totalClients}</div>
            <p className="text-xs text-slate-500 mt-1">All assigned to you</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setFilterStatus("ACTIVE")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Active Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{kpiStats.activeClients}</div>
            <p className="text-xs text-slate-500 mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setFilterStatus("PENDING")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              Pending Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{kpiStats.totalPendingWork}</div>
            <p className="text-xs text-slate-500 mt-1">Tasks to complete</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setFilterStatus("COMPLETED")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Completed Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{kpiStats.totalCompletedWork}</div>
            <p className="text-xs text-slate-500 mt-1">Tasks completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              My Clients
              {filterStatus && (
                <Badge variant="secondary" className="ml-2">
                  Filtered: {filterStatus}
                </Badge>
              )}
            </CardTitle>
            {filterStatus && (
              <button
                onClick={() => setFilterStatus(null)}
                className="text-sm text-blue-600 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">
                {filterStatus ? "No clients match this filter" : "No clients assigned to you yet"}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Contact your super admin to get clients assigned
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Pending</TableHead>
                  <TableHead className="text-center">Completed</TableHead>
                  <TableHead className="text-right">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const totalWork = client.pendingWork + client.completedWork;
                  const progressPercent = totalWork > 0 ? Math.round((client.completedWork / totalWork) * 100) : 0;

                  return (
                    <TableRow key={client._id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                              {client.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{client.name}</div>
                            <div className="text-xs text-slate-500">
                              Joined {formatDate(client.joinedDate)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{client.companyName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs text-slate-500">
                          <span>{client.email || "-"}</span>
                          <span>{client.phone || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.status === "ACTIVE" ? "default" : "secondary"}>
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          {client.pendingWork}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {client.completedWork}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${progressPercent === 100
                                ? 'bg-green-600'
                                : progressPercent > 50
                                  ? 'bg-blue-600'
                                  : 'bg-orange-600'
                                }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-600 w-10 text-right">
                            {progressPercent}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Additional Stats (Optional) */}
      {clients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Average Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(
                  clients.reduce((sum, c) => {
                    const total = c.pendingWork + c.completedWork;
                    return sum + (total > 0 ? (c.completedWork / total) * 100 : 0);
                  }, 0) / clients.length
                )}%
              </div>
              <p className="text-xs text-slate-500 mt-1">Across all clients</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total Work</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpiStats.totalPendingWork + kpiStats.totalCompletedWork}
              </div>
              <p className="text-xs text-slate-500 mt-1">Combined tasks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {kpiStats.totalPendingWork + kpiStats.totalCompletedWork > 0
                  ? Math.round(
                    (kpiStats.totalCompletedWork /
                      (kpiStats.totalPendingWork + kpiStats.totalCompletedWork)) * 100
                  )
                  : 0}%
              </div>
              <p className="text-xs text-slate-500 mt-1">Tasks completed</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Main Dashboard Page with Role-Based Routing
export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Redirect based on role
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      // Redirect SUPER_ADMIN to their dashboard
      if (user.role === "SUPER_ADMIN") {
        router.push("/super-admin");
      }
    }
  }, [user, isAuthenticated, loading, router]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Not authenticated (handled by AuthContext redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  // SUPER_ADMIN redirects to /super-admin (handled in useEffect)
  if (user.role === "SUPER_ADMIN") {
    return null; // Will redirect
  }

  // ADMIN and USER see their dashboard with real backend data
  return <AdminDashboard role={user.role} userId={user.id || user.id} />;
}
