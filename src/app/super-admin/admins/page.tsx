"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useSuperAdmin } from "@/context/super-admin-context";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ShieldAlert, UserCheck, UserMinus, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { CreateAdminDialog } from "@/components/super-admin/CreateAdminDialog";

export default function AdminManagementPage() {
    const { user } = useAuth();
    const { admins, loading, error, updateAdminStatus, refreshAdmins } = useSuperAdmin();

    // Handlers
    const handleToggleStatus = async (adminId: string) => {
        try {
            await updateAdminStatus(adminId);
        } catch (err) {
            console.error("Failed to update status:", err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Management</h1>
                    <p className="text-slate-500">Manage admin access and view their current load.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={refreshAdmins} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <CreateAdminDialog />
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Admin Management Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-blue-600" />
                        Admin List ({admins.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {admins.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <p>No admins found. Create your first admin to get started.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Clients Assigned</TableHead>
                                    <TableHead>Capacity</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {admins.map((admin) => (
                                    <TableRow key={admin.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>{admin.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{admin.name}</span>
                                                    <span className="text-xs text-slate-500">{admin.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={admin.status === "ACTIVE" ? "default" : "destructive"}>
                                                {admin.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium">{admin.clientsAssigned}</span>
                                            <span className="text-slate-500"> / {admin.maxClients}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="w-full bg-slate-200 rounded-full h-2.5 max-w-[120px]">
                                                    <div
                                                        className={`h-2.5 rounded-full ${admin.utilizationPercentage! >= 80
                                                            ? "bg-red-600"
                                                            : admin.utilizationPercentage! >= 50
                                                                ? "bg-yellow-600"
                                                                : "bg-green-600"
                                                            }`}
                                                        style={{ width: `${admin.utilizationPercentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs text-slate-500">{admin.utilizationPercentage}% utilized</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={
                                                    admin.status === "ACTIVE"
                                                        ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        : "text-green-600 hover:text-green-700 hover:bg-green-50"
                                                }
                                                onClick={() => handleToggleStatus(admin.id)}
                                            >
                                                {admin.status === "ACTIVE" ? (
                                                    <>
                                                        <UserMinus className="mr-2 h-4 w-4" /> Revoke Access
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserCheck className="mr-2 h-4 w-4" /> Grant Access
                                                    </>
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
