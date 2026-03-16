"use client";

import { useAuth } from "@/context/auth-context";
import { useClient } from "@/context/client-context";
import { useCompany } from "@/context/company-context";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Search, Download, Plus, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { canManageClients } from "@/lib/roles";
import { downloadCSV } from "@/lib/export";

export default function AdminClientListPage() {
    const { user } = useAuth();
    const {
        clients,
        stats,
        loading,
        filters,
        pagination,
        setPage,
        setFilters,
        createClient,
        updateClient,
    } = useClient();
    const { selectedCompany } = useCompany();
    const router = useRouter();

    // ✅ Manually sync global company filter to this specific page
    useEffect(() => {
        if (selectedCompany?._id) {
            setFilters({ ...filters, company: selectedCompany._id });
        } else {
            const { company, ...rest } = filters;
            setFilters(rest);
        }
    }, [selectedCompany?._id]);

    const [localSearch, setLocalSearch] = useState(filters.search || "");

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        companyName: "",
        email: "",
        phone: "",
        status: "ACTIVE",
        pendingWork: 0,
        completedWork: 0,
    });

    // Enforce role check (though middleware should handle this)
    useEffect(() => {
        if (user && !canManageClients(user.role)) {
            router.push("/");
        }
    }, [user, router]);

    // Handle search Input debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== filters.search) {
                setFilters(prev => ({ ...prev, search: localSearch }));
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [localSearch]);

    const handleStatusChange = (val: string) => {
        setFilters(prev => {
            if (val === "all") {
                const { status, ...rest } = prev;
                return rest;
            }
            return { ...prev, status: val as 'ACTIVE' | 'INACTIVE' };
        });
    };

    const handleOpenAdd = () => {
        setEditingClient(null);
        setFormData({
            name: "",
            companyName: "",
            email: "",
            phone: "",
            status: "ACTIVE",
            pendingWork: 0,
            completedWork: 0,
        });
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (client: any) => {
        setEditingClient(client);
        setFormData({
            name: client.name,
            companyName: client.companyName,
            email: client.email || "",
            phone: client.phone || "",
            status: client.status || "ACTIVE",
            pendingWork: client.pendingWork || 0,
            completedWork: client.completedWork || 0,
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload = {
                name: formData.name,
                companyName: formData.companyName,
                email: formData.email,
                phone: formData.phone,
                status: formData.status as 'ACTIVE' | 'INACTIVE',
                pendingWork: formData.pendingWork,
                completedWork: formData.completedWork,
            };

            if (editingClient) {
                await updateClient(editingClient._id, payload);
            } else {
                await createClient(payload);
            }
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Operation failed");
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const handleExport = async () => {
        try {
            const { clientService } = await import("@/services/clientService");
            const response = await clientService.getAllClients({ ...filters, limit: 'all' });
            
            const exportData = response.clients.map((client: any) => ({
                "Client Name": client.name,
                "Company": client.companyName,
                "Email": client.email || "",
                "Phone": client.phone || "",
                "Status": client.status,
                "Pending Work": client.pendingWork || 0,
                "Completed Work": client.completedWork || 0,
                "Joined Date": formatDate(client.joinedDate || client.createdAt)
            }));
            downloadCSV(exportData, "admin_clients_export");
        } catch (error) {
            toast.error("Failed to export clients");
        }
    };

    if (loading && clients.length === 0) {
        return <div className="p-8 text-center text-slate-500">Loading your clients...</div>;
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manage My Clients</h1>
                    <p className="text-slate-500">View and manage clients assigned specifically to you.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={handleOpenAdd}>
                                <Plus className="mr-2 h-4 w-4" /> Add My Client
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
                                <DialogDescription>
                                    {editingClient ? "Update client details here." : "Enter details for the new client. It will be automatically assigned to you."}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6 py-4">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Basic Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-slate-700">Client Name *</Label>
                                            <Input
                                                id="name"
                                                placeholder="e.g. John Doe"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                className="border-slate-200 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="company" className="text-slate-700">Primary Company *</Label>
                                            <Input
                                                id="company"
                                                placeholder="e.g. Acme Corp"
                                                value={formData.companyName}
                                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                                required
                                                className="border-slate-200 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2 border-t border-slate-100">
                                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Contact Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-slate-700">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="john@example.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="border-slate-200 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-slate-700">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                placeholder="10-digit mobile"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="border-slate-200 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2 border-t border-slate-100">
                                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Account Settings</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="status" className="text-slate-700">Client Status</Label>
                                            <Select
                                                value={formData.status}
                                                onValueChange={(val) => setFormData({ ...formData, status: val })}
                                            >
                                                <SelectTrigger id="status" className="border-slate-200">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {editingClient && (
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="pendingWork" className="text-slate-700">Pending Work</Label>
                                                <Input
                                                    id="pendingWork"
                                                    type="number"
                                                    min="0"
                                                    value={formData.pendingWork}
                                                    onChange={(e) => setFormData({ ...formData, pendingWork: parseInt(e.target.value) || 0 })}
                                                    className="border-slate-200 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="completedWork" className="text-slate-700">Completed Work</Label>
                                                <Input
                                                    id="completedWork"
                                                    type="number"
                                                    min="0"
                                                    value={formData.completedWork}
                                                    onChange={(e) => setFormData({ ...formData, completedWork: parseInt(e.target.value) || 0 })}
                                                    className="border-slate-200 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="px-6 border-slate-200 text-slate-600 hover:bg-slate-50">
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={loading} className="px-8 bg-blue-600 hover:bg-blue-700 shadow-md transition-all">
                                        {loading ? "Processing..." : editingClient ? "Update Client" : "Add Client"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Export My List
                    </Button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">My Total Clients</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalClients || clients.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">My Active Clients</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {stats?.activeClients || clients.filter(c => c.status === "ACTIVE").length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">My Pending Work</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {stats?.totalPendingWork || clients.reduce((sum, c) => sum + (c.pendingWork || 0), 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Table Section */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            My Assigned Clients
                        </CardTitle>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search my clients..."
                                    className="pl-8"
                                    value={localSearch}
                                    onChange={(e) => setLocalSearch(e.target.value)}
                                />
                            </div>
                            <Select value={filters.status || "all"} onValueChange={handleStatusChange}>
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client Name</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Work Load</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clients.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                            No clients found assigned to you.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    clients.map((client) => (
                                        <TableRow key={client._id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="bg-blue-100 text-blue-700">
                                                            {client.name.slice(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {client.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>{client.companyName}</TableCell>
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
                                            <TableCell>
                                                <div className="flex flex-col text-xs">
                                                    <span className="text-orange-600 font-medium">Pending: {client.pendingWork}</span>
                                                    <span className="text-green-600">Done: {client.completedWork}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-sm">{formatDate(client.joinedDate || client.createdAt)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => handleOpenEdit(client)}
                                                >
                                                    <Pencil className="h-4 w-4 text-slate-500 hover:text-blue-600" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-2 py-4 border-t">
                            <div className="text-sm text-slate-500">
                                Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(Math.max(1, pagination.page - 1))}
                                    disabled={pagination.page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(Math.min(pagination.totalPages, pagination.page + 1))}
                                    disabled={pagination.page === pagination.totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
