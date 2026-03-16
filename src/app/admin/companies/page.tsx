"use client";

import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { useClient } from "@/context/client-context";
import companyService from "@/services/companyService";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Building2, Search, Download, Plus, Pencil, Users } from "lucide-react";
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
import { ManageMembersDialog } from "@/components/company/ManageMembersDialog";
import { canManageCompanies, isAdmin, canDelete } from "@/lib/roles";
import { downloadCSV } from "@/lib/export";

export default function AdminCompanyListPage() {
    const { user } = useAuth();
    const {
        companies,
        stats,
        loading,
        filters,
        setFilters,
        pagination,
        setPage,
        createCompany,
        updateCompany,
        deleteCompany,
        refreshAll,
    } = useCompany();
    const { clients, getAllClients } = useClient();
    const router = useRouter();

    const [localSearch, setLocalSearch] = useState(filters.search || "");

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<any | null>(null);
    const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
    const [selectedCompanyMembers, setSelectedCompanyMembers] = useState<any | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        client: "",
        industry: "",
        registrationNumber: "",
        email: "",
        phone: "",
        address: {
            street: "",
            city: "",
            state: "",
            pincode: "",
            country: "India",
        }
    });

    // Enforce role check
    useEffect(() => {
        if (user && !canManageCompanies(user.role)) {
            router.push("/");
        }
    }, [user, router]);

    // Load clients for the dropdown via context (getAllClients has built-in caching)
    useEffect(() => {
        if (isAdmin(user?.role)) {
            getAllClients(); // Respects cache — won't re-fetch within 60s
        }
    }, [user?.role]);

    // Handle search Input debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== filters.search) {
                setFilters(prev => ({ ...prev, search: localSearch }));
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [localSearch, setFilters, filters.search]);

    const handleClientChange = (val: string) => {
        setFilters(prev => {
            if (val === "all") {
                const { client, ...rest } = prev;
                return rest;
            }
            return { ...prev, client: val };
        });
    };

    const handleOpenAdd = () => {
        setEditingCompany(null);
        setFormData({
            name: "",
            client: clients.length === 1 ? clients[0]._id : "",
            industry: "",
            registrationNumber: "",
            email: "",
            phone: "",
            address: {
                street: "",
                city: "",
                state: "",
                pincode: "",
                country: "India",
            }
        });
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (company: any) => {
        setEditingCompany(company);
        setFormData({
            name: company.name,
            client: company.client?._id || "",
            industry: company.industry || "",
            registrationNumber: company.registrationNumber || "",
            email: company.email || "",
            phone: company.phone || "",
            address: {
                street: company.address?.street || "",
                city: company.address?.city || "",
                state: company.address?.state || "",
                pincode: company.address?.pincode || "",
                country: company.address?.country || "India",
            }
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.client) {
            toast.error("Please select a client for this company");
            return;
        }

        try {
            if (editingCompany) {
                await updateCompany(editingCompany._id, formData);
            } else {
                await createCompany(formData);
            }
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Operation failed");
        }
    };

    const handleOpenMembers = (company: any) => {
        setSelectedCompanyMembers(company);
        setIsMembersDialogOpen(true);
    };

    const handleDelete = async (companyId: string) => {
        if (!window.confirm("Are you sure you want to delete this company?")) return;
        try {
            await deleteCompany(companyId);
            toast.success("Company deleted successfully");
            refreshAll(true);
        } catch (error: any) {
            toast.error(error.message || "Failed to delete company");
        }
    };

    const handleMemberUpdate = () => {
        refreshAll(true);
        if (selectedCompanyMembers) {
            const updated = companies.find((c: any) => c._id === selectedCompanyMembers._id);
            if (updated) setSelectedCompanyMembers(updated);
        }
    };

    const handleExport = async () => {
        try {
            const response = await companyService.getAllCompanies({ ...filters, limit: 'all' });
            const exportData = response.companies.map((company: any) => ({
                "Company Name": company.name,
                "Client Owner": (company.client as any)?.name || "N/A",
                "Industry": company.industry || "General",
                "Registration Number": company.registrationNumber || "N/A",
                "Email": company.email || "",
                "Phone": company.phone || "",
                "Street": company.address?.street || "",
                "City": company.address?.city || "",
                "State": company.address?.state || "",
                "Pincode": company.address?.pincode || "",
                "Country": company.address?.country || "India",
                "Members Count": company.members?.length || 0,
                "Added Date": new Date(company.createdAt || Date.now()).toLocaleDateString("en-GB")
            }));
            downloadCSV(exportData, "admin_companies_export");
        } catch (error) {
            toast.error("Failed to export companies");
        }
    };

    if (loading && companies.length === 0) {
        return <div className="p-8 text-center text-slate-500">Loading your companies...</div>;
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manage Companies</h1>
                    <p className="text-slate-500">View and manage companies belonging to your assigned clients.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={handleOpenAdd}>
                                <Plus className="mr-2 h-4 w-4" /> Add Company
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingCompany ? "Edit Company" : "Add New Company"}</DialogTitle>
                                <DialogDescription>
                                    Enter details for the company. It must belong to one of your assigned clients.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Primary Details</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 col-span-2">
                                            <Label htmlFor="client" className="text-slate-700 font-medium">Client Ownership *</Label>
                                            <Select
                                                value={formData.client}
                                                onValueChange={(val) => setFormData({ ...formData, client: val })}
                                            >
                                                <SelectTrigger className="border-slate-200">
                                                    <SelectValue placeholder="Select owning client..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {clients.map((client) => (
                                                        <SelectItem key={client._id} value={client._id}>
                                                            {client.name} ({client.companyName})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <Label htmlFor="name" className="text-slate-700 font-medium">Registered Company Name *</Label>
                                            <Input
                                                id="name"
                                                placeholder="e.g. Acme Tech Solutions Private Limited"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                className="border-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="industry" className="text-slate-700 font-medium">Industry / Sector</Label>
                                            <Input
                                                id="industry"
                                                placeholder="e.g. IT Services"
                                                value={formData.industry}
                                                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                                className="border-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="regNum" className="text-slate-700 font-medium">Registration Number (CIN)</Label>
                                            <Input
                                                id="regNum"
                                                placeholder="U00000XX0000XXX000000"
                                                value={formData.registrationNumber}
                                                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                                                className="border-slate-200 uppercase"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Contact Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-slate-700 font-medium">Company Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="contact@company.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="border-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-slate-700 font-medium">Company Phone</Label>
                                            <Input
                                                id="phone"
                                                placeholder="+91-XXXXXXXXXX"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="border-slate-200"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Registered Address</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="street" className="text-slate-700 font-medium">Street Address</Label>
                                            <Input
                                                id="street"
                                                placeholder="Unit No, Building, Area"
                                                value={formData.address.street}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    address: { ...formData.address, street: e.target.value }
                                                })}
                                                className="border-slate-200"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="city" className="text-slate-700 font-medium">City</Label>
                                                <Input
                                                    id="city"
                                                    placeholder="Mumbai"
                                                    value={formData.address.city}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        address: { ...formData.address, city: e.target.value }
                                                    })}
                                                    className="border-slate-200"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="state" className="text-slate-700 font-medium">State</Label>
                                                <Input
                                                    id="state"
                                                    placeholder="Maharashtra"
                                                    value={formData.address.state}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        address: { ...formData.address, state: e.target.value }
                                                    })}
                                                    className="border-slate-200"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="pincode" className="text-slate-700 font-medium">Pincode</Label>
                                                <Input
                                                    id="pincode"
                                                    placeholder="400001"
                                                    value={formData.address.pincode}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        address: { ...formData.address, pincode: e.target.value }
                                                    })}
                                                    className="border-slate-200"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="country" className="text-slate-700 font-medium">Country</Label>
                                                <Input
                                                    id="country"
                                                    value={formData.address.country}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        address: { ...formData.address, country: e.target.value }
                                                    })}
                                                    className="border-slate-200"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="px-6">
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={loading} className="px-8 bg-blue-600 hover:bg-blue-700 shadow-sm">
                                        {loading ? "Saving..." : editingCompany ? "Update Company" : "Create Company"}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Export List
                    </Button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Companies</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalCompanies || companies.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Managed Clients</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Industry Diversity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {new Set(companies.map(c => c.industry).filter(Boolean)).size}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Table Section */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            Scoped Companies
                        </CardTitle>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search companies..."
                                    className="pl-8"
                                    value={localSearch}
                                    onChange={(e) => setLocalSearch(e.target.value)}
                                />
                            </div>
                            <Select value={filters.client || "all"} onValueChange={handleClientChange}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Clients" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All My Clients</SelectItem>
                                    {clients.map(client => (
                                        <SelectItem key={client._id} value={client._id}>
                                            {client.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Company Name</TableHead>
                                <TableHead>Belongs to Client</TableHead>
                                <TableHead>Industry</TableHead>
                                <TableHead>Reg. Number</TableHead>
                                <TableHead>Members</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {companies.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                        No companies found for your assigned clients.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                companies.map((company) => (
                                    <TableRow key={company._id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                                                    <Building2 className="h-4 w-4" />
                                                </div>
                                                {company.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{(company.client as any)?.name || "N/A"}</span>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{(company.client as any)?.companyName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-normal">
                                                {company.industry || "General"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{company.registrationNumber || "N/A"}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Users className="h-3 w-3 text-slate-400" />
                                                <span className="text-xs text-slate-600">{company.memberCount || 0}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 group hover:border-blue-200 hover:bg-blue-50"
                                                    onClick={() => handleOpenMembers(company)}
                                                >
                                                    <Users className="h-3.5 w-3.5 mr-1.5 text-slate-400 group-hover:text-blue-600" />
                                                    <span className="text-xs group-hover:text-blue-700">Members</span>
                                                </Button>
                                                 {canDelete(user?.role) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDelete(company._id)}
                                                        title="Delete Company"
                                                    >
                                                        <Badge variant="outline" className="border-none p-0 text-red-500">
                                                            <Plus className="h-4 w-4 rotate-45" />
                                                        </Badge>
                                                    </Button>
                                                 )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => handleOpenEdit(company)}
                                                >
                                                    <Pencil className="h-4 w-4 text-slate-500 hover:text-blue-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

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

            {/* Render Members Dialog */}
            {selectedCompanyMembers && (
                <ManageMembersDialog
                    isOpen={isMembersDialogOpen}
                    onClose={() => setIsMembersDialogOpen(false)}
                    company={selectedCompanyMembers}
                    onUpdate={handleMemberUpdate}
                />
            )}
        </div>
    );
}
