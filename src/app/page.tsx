"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { isSuperAdmin, isAdmin } from "@/lib/roles";
import { useClient } from "@/context/client-context";
import { useCompany } from "@/context/company-context";
import { useCompliance } from "@/context/compliance-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useConsultation } from "@/context/consultation-context";
import { useDocument } from "@/context/document-context";
import { Button } from "@/components/ui/button";
import { Users, FileText, CheckCircle, Clock, AlertCircle, MessageSquare, Download } from "lucide-react";
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
function AdminDashboard({ role }: { role: string; }) {
  const router = useRouter();
  const { clients, stats, loading: clientsLoading } = useClient();
  const { consultations, loading: consultLoading } = useConsultation();
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  console.log("clients", clients);
  const loading = clientsLoading || consultLoading;

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

  if (loading && isAdmin(role)) {
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
            {isAdmin(role) ? "My Clients Dashboard" : "Dashboard"}
          </h1>
          <p className="text-slate-500 mt-1">
            {isAdmin(role)
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

        {/* Consultation Card for Admin */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/consult')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-600" />
              Active Consultations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {consultations.filter(c => c.status !== 'COMPLETED').length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Requiring attention</p>
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
    </div>
  );
}

// User Dashboard Component - Shows THEIR companies and compliance stats
function UserDashboard() {
  const router = useRouter();
  const { companies, loading: companiesLoading, selectedCompany } = useCompany();
  const { stats: complianceStats, loading: statsLoading, refreshAll } = useCompliance();
  const { consultations, loading: consultLoading } = useConsultation();
  const { documents, loading: docsLoading } = useDocument();

  console.log("selectedCompany", companies);
  const loading = companiesLoading || statsLoading || consultLoading || docsLoading;

  useEffect(() => {
    if (selectedCompany?._id) {
      refreshAll(selectedCompany._id);
    }
  }, [selectedCompany?._id, refreshAll]);

  if (loading) {
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your companies and compliance status</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Users className="h-4 w-4" />
              My Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
            <p className="text-xs text-slate-500 mt-1">Registered businesses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              Pending Compliances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{complianceStats?.pending || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Needs action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              Delayed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{complianceStats?.delayed || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{complianceStats?.completed || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Successfully filed</p>
          </CardContent>
        </Card>
      </div>

      {/* Company List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            My Companies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No companies found</p>
              <p className="text-xs text-slate-400 mt-2">Add your first company to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company._id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.phone}</TableCell>
                    <TableCell>
                      <Badge variant={company.status === "ACTIVE" ? "default" : "secondary"}>
                        {company.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-slate-500">
                        {company.fullAddress}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{company.memberCount} Members</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => router.push('/companies')} className="text-sm text-blue-600 hover:underline">View Details</button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Consultations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Recent Consultations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {consultations.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                No recent consultations.
              </div>
            ) : (
              <div className="space-y-4">
                {consultations.slice(0, 3).map((consult) => (
                  <div key={consult._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{consult.type === 'CA' ? 'Chartered Accountant' : 'Legal Consultant'}</p>
                      <p className="text-xs text-slate-500">Ticket #{consult.ticketNumber}</p>
                    </div>
                    <Badge variant={consult.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {consult.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Recent Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                No recent documents.
              </div>
            ) : (
              <div className="space-y-4">
                {documents.slice(0, 3).map((doc) => (
                  <div key={doc._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 truncate max-w-[150px]">{doc.name}</p>
                        <p className="text-xs text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
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

// Main Dashboard Page with Role-Based Routing
export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Redirect based on role
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      // Redirect SUPER_ADMIN to their dashboard
      if (isSuperAdmin(user.role)) {
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
  if (isSuperAdmin(user.role)) {
    return null; // Will redirect
  }

  // ADMIN see their dashboard
  if (isAdmin(user.role)) {
    return <AdminDashboard role={user.role} userId={user._id} />;
  }

  // USER (Client) sees UserDashboard
  return <UserDashboard />;
}
