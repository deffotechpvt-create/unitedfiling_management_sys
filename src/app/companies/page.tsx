"use client";

import { useAuth } from "@/context/auth-context";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useState, useMemo, useEffect } from "react";
import { useClient } from "@/context/client-context";
import { Search, Download, Trash2, Edit, Users, Plus, Loader2, X, RefreshCcw, Building2, ShieldCheck, Mail, Phone, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ManageMembersDialog } from "@/components/company/ManageMembersDialog";
import { Company } from "@/types";
import { toast } from "sonner";
import { isUser } from "@/lib/roles";

export default function CompaniesManagementPage() {
    const { user, loading: authLoading } = useAuth();
    const {
        companies,
        createCompany,
        updateCompany,
        deleteCompany,
        loading,
        refreshAll: refreshCompanies,
        filters,
        setFilters,
        exportAllCompanies,
        pagination,
        setPage,
    } = useCompany();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [form, setForm] = useState({ 
        name: "", 
        email: "", 
        phone: "", 
        client: "",
        registrationNumber: "",
        industry: "",
        address: {
            street: "",
            city: "",
            state: "",
            pincode: "",
            country: "India",
        }
    });
    const { clients, loading: clientsLoading } = useClient();
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [membersDialogOpen, setMembersDialogOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

    const [searchQuery, setSearchQuery] = useState(filters.search || "");

    // Role helpers
    const isSuperAdmin = user?.role === "SUPER_ADMIN";
    const isAdmin = user?.role === "ADMIN";
    const canManageAll = isSuperAdmin;

    // Search Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== filters.search) {
                setFilters(prev => ({ ...prev, search: searchQuery }));
                setPage(1); // Reset to first page on search change
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle open for create/edit

    const openCreate = () => {
        setForm({ 
            name: "", 
            email: "", 
            phone: "", 
            client: "",
            registrationNumber: "",
            industry: "",
            address: {
                street: "",
                city: "",
                state: "",
                pincode: "",
                country: "India",
            }
        });
        setEditingCompany(null);
        setError(null);
        setIsDialogOpen(true);
    };

    const openEdit = (company: Company) => {
        setForm({
            name: company.name || "",
            email: company.email || "",
            phone: company.phone || "",
            client: typeof company.client === "string" ? company.client : company.client?._id || "",
            registrationNumber: company.registrationNumber || "",
            industry: company.industry || "",
            address: {
                street: company.address?.street || "",
                city: company.address?.city || "",
                state: company.address?.state || "",
                pincode: company.address?.pincode || "",
                country: company.address?.country || "India",
            }
        });
        setEditingCompany(company);
        setError(null);
        setIsDialogOpen(true);
    };

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setError(null);
        try {
            // Prepare data for backend
            const payload: any = {
                name: form.name,
                email: form.email,
                phone: form.phone,
                registrationNumber: form.registrationNumber,
                industry: form.industry,
                address: form.address,
            };

            // Only Admins explicitly attach the client
            if (!isUser(user?.role)) {
                if (!form.client) {
                    toast.error("Please select a client to allocate the company");
                    setFormLoading(false);
                    return;
                }
                payload.client = form.client;
            }
            if (editingCompany) {
                await updateCompany(editingCompany._id, payload);
                toast.success("Company updated");
            } else {
                await createCompany(payload);
                toast.success("Company created");
            }
            setIsDialogOpen(false);
            refreshCompanies(true);
        } catch (err: any) {
            setError(err.message || "Error saving company");
        } finally {
            setFormLoading(false);
        }
    };
    // Handle delete
    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"? This will also delete all associated compliances and calendar events.`)) {
            return;
        }
        await deleteCompany(id);
    };

    // Handle open members dialog
    const openMembers = (company: Company) => {
        setSelectedCompany(company);
        setMembersDialogOpen(true);
    };

    const handleExport = async () => {
        await exportAllCompanies();
    };

    if (authLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#002A52]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Manage Companies</h1>
                    <p className="text-sm text-slate-500">Add, edit, and organize client companies</p>
                </div>
                <div className="flex items-center gap-2">
                    {(isSuperAdmin || isAdmin) && (
                        <Button 
                            variant="outline" 
                            className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium h-10 px-4"
                            onClick={handleExport}
                            disabled={loading}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                    )}
                    <Button 
                        onClick={openCreate}
                        className="bg-[#002A52] hover:bg-[#001f3f] text-white font-semibold h-10 px-4 shadow-sm"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Company
                    </Button>
                </div>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search companies by name, email or reg no..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-10 bg-white border-slate-200 focus-visible:ring-[#002A52]"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-500 hover:text-slate-900 h-8 gap-1.5"
                                onClick={() => { setSearchQuery(""); refreshCompanies(true); }}
                            >
                                <RefreshCcw className="h-3 w-3" />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading && companies.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white">
                            <Loader2 className="h-10 w-10 animate-spin text-[#002A52] mb-4" />
                            <p className="text-slate-500 animate-pulse font-medium">Fetching companies...</p>
                        </div>
                    ) : companies.length === 0 ? (
                        <div className="text-center py-20 bg-white">
                            <Building2 className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-900 font-semibold text-lg">No Companies Found</p>
                            <p className="text-slate-500">Try adjusting your filters or search query.</p>
                            <Button 
                                variant="outline" 
                                className="mt-6 border-slate-200 text-slate-600"
                                onClick={() => { setSearchQuery(""); refreshCompanies(true); }}
                            >
                                Clear All Searches
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/80">
                                    <TableRow className="hover:bg-transparent border-slate-100">
                                        <TableHead className="w-[220px] font-semibold text-slate-700">Company Details</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Industry</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Contact</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Location</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Legal Info</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Management</TableHead>
                                        <TableHead className="text-right font-semibold text-slate-700 pr-6 w-[120px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {companies.map((company: any) => {
                                         const isOwner = company.myRole === 'OWNER' || company.myRole === 'SUPER_ADMIN' || company.myRole === 'ADMIN';
                                         const clientName = typeof company.client === 'object' ? company.client?.name : 'N/A';
                                        
                                        return (
                                            <TableRow key={company._id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                                                <TableCell>
                                                    <div className="flex flex-col py-1">
                                                        <span className="font-bold text-slate-900 text-sm whitespace-nowrap">{company.name}</span>
                                                        <span className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 uppercase font-semibold">
                                                            <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                                            ID: {company._id.slice(-6)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-100 text-[10px] font-bold uppercase whitespace-nowrap">
                                                        {company.industry || 'General'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                            {company.email || 'No email'}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                            {company.phone || 'No phone'}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col max-w-[180px]">
                                                        <span className="text-xs text-slate-700 font-medium truncate" title={company.address?.street}>
                                                            {company.address?.street || 'No street'}
                                                        </span>
                                                        <span className="text-[11px] text-slate-500">
                                                            {[company.address?.city, company.address?.state].filter(Boolean).join(', ') || 'N/A'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-medium text-slate-900">
                                                            Reg: {company.registrationNumber || 'N/A'}
                                                        </span>
                                                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            Joined: {new Date(company.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <Badge variant="outline" className={cn(
                                                                "w-fit font-bold text-[10px] uppercase px-2 py-0.5",
                                                                company.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"
                                                            )}>
                                                                {company.status}
                                                            </Badge>
                                                            {company.myRole && (
                                                                <Badge variant="outline" className={cn(
                                                                    "w-fit font-bold text-[10px] uppercase px-2 py-0.5",
                                                                    company.myRole === 'OWNER' ? "bg-orange-50 text-orange-600 border-orange-200" : 
                                                                    company.myRole === 'EDITOR' ? "bg-blue-50 text-blue-600 border-blue-200" : 
                                                                    "bg-slate-50 text-slate-500 border-slate-200"
                                                                )}>
                                                                    {company.myRole}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] font-medium text-slate-400">
                                                            Mgr: <span className="text-blue-600">{clientName}</span>
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {(isSuperAdmin || isAdmin || isOwner) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                                                onClick={() => openEdit(company)}
                                                                title="Edit Details"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {(isSuperAdmin || isAdmin) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-500 hover:text-purple-600 hover:bg-purple-50"
                                                                onClick={() => openMembers(company)}
                                                                title="Manage Access"
                                                            >
                                                                <Users className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {isSuperAdmin && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                                onClick={() => handleDelete(company._id, company.name)}
                                                                title="Delete Permanently"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {!loading && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                            <p className="text-sm text-slate-500">
                                Showing page <span className="font-medium text-slate-900">{pagination.page}</span> of <span className="font-medium text-slate-900">{pagination.totalPages}</span>
                                <span className="ml-1">({pagination.totalCount} total records)</span>
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(Math.max(1, pagination.page - 1))}
                                    disabled={pagination.page === 1}
                                    className="h-8 gap-1"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(Math.min(pagination.totalPages, pagination.page + 1))}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="h-8 gap-1"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCompany ? "Edit Company" : "Create Company"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">General Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <Label>Company Name</Label>
                                        <Input
                                            value={form.name}
                                            placeholder="e.g. Acme Corp"
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, name: e.target.value }))
                                            }
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            value={form.email}
                                            placeholder="contact@company.com"
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, email: e.target.value }))
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label>Phone</Label>
                                        <Input
                                            value={form.phone}
                                            placeholder="+91-XXXXXXXXXX"
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, phone: e.target.value }))
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label>Registration Number</Label>
                                        <Input
                                            value={form.registrationNumber}
                                            placeholder="e.g. U12345..."
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, registrationNumber: e.target.value }))
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label>Industry</Label>
                                        <Input
                                            value={form.industry}
                                            placeholder="e.g. Software"
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, industry: e.target.value }))
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Registered Address</h3>
                                <div className="space-y-4">
                                    <div>
                                        <Label>Street Address</Label>
                                        <Input
                                            value={form.address.street}
                                            placeholder="Unit No, Building, Area"
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    address: { ...f.address, street: e.target.value }
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>City</Label>
                                            <Input
                                                value={form.address.city}
                                                placeholder="City"
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        address: { ...f.address, city: e.target.value }
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label>State</Label>
                                            <Input
                                                value={form.address.state}
                                                placeholder="State"
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        address: { ...f.address, state: e.target.value }
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label>Pincode</Label>
                                            <Input
                                                value={form.address.pincode}
                                                placeholder="Pincode"
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        address: { ...f.address, pincode: e.target.value }
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label>Country</Label>
                                            <Input
                                                value={form.address.country}
                                                placeholder="Country"
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        address: { ...f.address, country: e.target.value }
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Client Selector (Hidden for USER) */}
                            {!isUser(user?.role) && (
                                <div className="pt-4 border-t border-slate-100">
                                    <Label>Client Ownership</Label>
                                    <select
                                        className="w-full border rounded px-3 py-2 border-slate-200 mt-1"
                                        value={form.client}
                                        onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
                                        required={!isUser(user?.role)}
                                        disabled={clientsLoading}
                                        aria-label="Client selector"
                                    >
                                        <option value="" disabled>
                                            {clientsLoading ? "Loading clients..." : "Select a client"}
                                        </option>
                                        {clients.map(client => (
                                            <option key={client._id} value={client._id}>
                                                {client.name} ({client.companyName})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-100">{error}</div>
                        )}
                        <DialogFooter className="pt-2 border-t border-slate-100">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                disabled={formLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={formLoading} className="bg-[#002A52] hover:bg-[#001f3f]">
                                {formLoading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {editingCompany ? "Updating..." : "Creating..."}
                                    </span>
                                ) : editingCompany ? (
                                    "Update Company"
                                ) : (
                                    "Create Company"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Members Dialog */}
            {selectedCompany && (
                <ManageMembersDialog
                    isOpen={membersDialogOpen}
                    onClose={() => setMembersDialogOpen(false)}
                    company={selectedCompany}
                    onUpdate={refreshCompanies}
                />
            )}
        </div>
    );
}
