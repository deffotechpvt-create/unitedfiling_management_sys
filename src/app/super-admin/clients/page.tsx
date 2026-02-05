"use client";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { Users, Search, Download, Plus, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useClient } from "@/context/client-context";
import { userService } from "@/services/userService";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ClientListPage() {
    const {
        clients,
        stats,
        loading,
        filters,
        setFilters,
        createClient,
        updateClient,
        deleteClient,
        assignClientToAdmin,
        refreshClients,
    } = useClient();

    const [admins, setAdmins] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [adminFilter, setAdminFilter] = useState<string>("all");

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<any | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        companyName: "",
        email: "",
        phone: "",
        assignedAdmin: "",
    });

    // Load admins on mount
    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        try {
            const response = await userService.getAllAdmins();
            setAdmins(response.admins || []);
        } catch (error) {
            console.error("Failed to load admins:", error);
        }
    };

    // Apply filters
    const filteredClients = clients.filter((client) => {
        const matchesSearch =
            client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || client.status === statusFilter;

        const matchesAdmin =
            adminFilter === "all" ||
            (adminFilter === "unassigned" && !client.assignedAdmin) ||
            client.assignedAdmin?._id === adminFilter;

        return matchesSearch && matchesStatus && matchesAdmin;
    });

    const handleAssignChange = async (clientId: string, val: string) => {
        try {
            if (val === "unassigned") {
                // Backend doesn't support unassign yet, so we'll skip for now
                toast.info("Unassign feature coming soon");
            } else {
                await assignClientToAdmin(clientId, val);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to assign client");
        }
    };

    const handleOpenAdd = () => {
        setEditingClient(null);
        setFormData({
            name: "",
            companyName: "",
            email: "",
            phone: "",
            assignedAdmin: "",
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
            assignedAdmin: client.assignedAdmin?._id || "",
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingClient) {
                await updateClient(editingClient._id, {
                    name: formData.name,
                    companyName: formData.companyName,
                    email: formData.email,
                    phone: formData.phone,
                    assignedAdmin: formData.assignedAdmin || undefined,
                });
            } else {
                await createClient({
                    name: formData.name,
                    companyName: formData.companyName,
                    email: formData.email,
                    phone: formData.phone,
                    assignedAdmin: formData.assignedAdmin || undefined,
                });
            }
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Operation failed");
        }
    };

    const handleDelete = async (clientId: string) => {
        if (confirm("Are you sure you want to delete this client?")) {
            try {
                await deleteClient(clientId);
            } catch (error: any) {
                toast.error(error.message || "Failed to delete client");
            }
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Client List</h1>
                    <p className="text-slate-500">View and manage all registered clients and their assignments.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={handleOpenAdd}>
                                <Plus className="mr-2 h-4 w-4" /> Add Client
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
                                <DialogDescription>
                                    {editingClient ? "Update client details here." : "Enter details for the new client."}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Client Name *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="company">Company Name *</Label>
                                        <Input
                                            id="company"
                                            value={formData.companyName}
                                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="admin">Assign to Admin (Optional)</Label>
                                        <Select
                                            value={formData.assignedAdmin || "unassigned"}
                                            onValueChange={(val) => setFormData({ ...formData, assignedAdmin: val === "unassigned" ? "" : val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select admin..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="unassigned">None (Unassigned)</SelectItem>
                                                {admins
                                                    .filter((a) => a.status === "ACTIVE")
                                                    .map((admin) => (
                                                        <SelectItem
                                                            key={admin.id}
                                                            value={admin.id}
                                                            disabled={admin.utilization?.isAtCapacity}
                                                        >
                                                            {admin.name} ({admin.utilization?.clientCount || 0}/{admin.utilization?.maxClients || 10})
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={loading}>
                                        {editingClient ? "Save Changes" : "Add Client"}
                                    </Button>
                                </div>
                            </form>

                        </DialogContent>
                    </Dialog>

                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Total Clients</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalClients}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Active</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.activeClients}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Unassigned</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{stats.unassignedClients}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500">Pending Work</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{stats.totalPendingWork}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Client Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            All Clients
                        </CardTitle>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            {/* Search */}
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search clients..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Status Filter */}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Admin Filter */}
                            <Select value={adminFilter} onValueChange={setAdminFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Admin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Admins</SelectItem>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {admins.map((admin) => (
                                        <SelectItem key={admin.id} value={admin.id}>
                                            {admin.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading clients...</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client Name</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Joined Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Work</TableHead>
                                    <TableHead>Assigned Admin</TableHead>
                                    <TableHead className="text-right">Assign</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredClients.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                                            No clients found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredClients.map((client) => {
                                        const assignedAdmin = client.assignedAdmin;
                                        return (
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
                                                <TableCell>{formatDate(client.joinedDate)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={client.status === "ACTIVE" ? "default" : "secondary"}>
                                                        {client.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-xs">
                                                        <span className="text-orange-600">Pending: {client.pendingWork}</span>
                                                        <span className="text-green-600">Done: {client.completedWork}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {assignedAdmin ? (
                                                        <Badge variant="outline" className="font-normal bg-slate-50">
                                                            {assignedAdmin.name}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-slate-400 italic text-sm">Unassigned</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Select
                                                        value={client.assignedAdmin?._id || "unassigned"}
                                                        onValueChange={(val) => handleAssignChange(client._id, val)}
                                                    >
                                                        <SelectTrigger className="w-[140px] ml-auto h-8 text-xs">
                                                            <SelectValue placeholder="Assign" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="unassigned" className="text-red-500">
                                                                Unassign
                                                            </SelectItem>
                                                            {admins
                                                                .filter((a) => a.status === "ACTIVE")
                                                                .map((admin) => (
                                                                    <SelectItem
                                                                        key={admin.id}
                                                                        value={admin.id}
                                                                        disabled={admin.utilization?.isAtCapacity}
                                                                    >
                                                                        {admin.name} ({admin.utilization?.clientCount || 0}/
                                                                        {admin.utilization?.maxClients || 10})
                                                                    </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => handleOpenEdit(client)}
                                                        >
                                                            <Pencil className="h-4 w-4 text-slate-500 hover:text-blue-600" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => handleDelete(client._id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-600" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
