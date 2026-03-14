"use client";

import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import companyService from "@/services/companyService";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useClient } from "@/context/client-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ManageMembersDialog } from "@/components/company/ManageMembersDialog";
import { Company } from "@/types";
import { toast } from "sonner";
import { downloadCSV } from "@/lib/export";
import { Download } from "lucide-react";

export default function SuperAdminCompanyPage() {
    const { user } = useAuth();
    const { 
        companies, 
        createCompany, 
        updateCompany, 
        deleteCompany, 
        loading, 
        filters,
        setFilters,
        pagination,
        setPage,
        fetchCompanies: refreshCompanies 
    } = useCompany();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [form, setForm] = useState({ name: "", email: "", phone: "", client: "" });
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [membersDialogOpen, setMembersDialogOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [localSearch, setLocalSearch] = useState(filters.search || "");
    const { clients, refreshAll: getAllClients } = useClient();

    useEffect(() => {
        getAllClients(false);
    }, []);

    // Handle search Input debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== filters.search) {
                setFilters(prev => ({ ...prev, search: localSearch }));
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [localSearch, setFilters, filters.search]);

    // Handle open for create/edit
    const openCreate = () => {
        setForm({ name: "", email: "", phone: "", client: "" } as any);
        setEditingCompany(null);
        setIsDialogOpen(true);
    };
    const openEdit = (company: Company | any) => {
        setForm({ 
            name: company.name || "", 
            email: company.email || "", 
            phone: company.phone || "",
            client: company.client?._id || typeof company.client === "string" ? company.client : ""
        } as any);
        setEditingCompany(company);
        setIsDialogOpen(true);
    };

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setError(null);
        try {
            if (!form.client && !editingCompany) {
                toast.error("Please select a client for this company");
                setFormLoading(false);
                return;
            }

            if (editingCompany) {
                await updateCompany(editingCompany._id, form);
                toast.success("Company updated");
            } else {
                await createCompany(form);
                toast.success("Company created");
            }
            setIsDialogOpen(false);
            refreshCompanies();
        } catch (err: any) {
            setError(err.message || "Error saving company");
        } finally {
            setFormLoading(false);
        }
    };

    // Handle delete
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this company?")) return;
        setFormLoading(true);
        try {
            await deleteCompany(id);
            toast.success("Company deleted");
            refreshCompanies();
        } catch (err: any) {
            toast.error(err.message || "Error deleting company");
        } finally {
            setFormLoading(false);
        }
    };

    // Handle open members dialog
    const openMembers = (company: Company) => {
        setSelectedCompany(company);
        setMembersDialogOpen(true);
    };

    const handleExport = async () => {
        try {
            const response = await companyService.getAllCompanies({ ...filters, limit: 'all' });
            const exportData = response.companies.map((company: any) => ({
                "Company Name": company.name,
                "Email": company.email || "",
                "Phone": company.phone || "",
                "Status": company.status,
                "Client Owner": typeof company.client === "object" ? company.client?.name : company.client,
                "Created Date": new Date(company.createdAt || Date.now()).toLocaleDateString("en-GB")
            }));
            downloadCSV(exportData, "super_admin_companies_export");
        } catch (error) {
            toast.error("Failed to export companies");
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex flex-col gap-1">
                    <CardTitle>All Companies</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                        <Input
                            placeholder="Search name, email, phone..."
                            className="w-64"
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                    <Button onClick={openCreate}>Create Company</Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading && companies.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">Loading...</div>
                ) : companies.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">No companies found.</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {companies.map(company => (
                                <TableRow key={company._id}>
                                    <TableCell>{company.name}</TableCell>
                                    <TableCell>{company.email}</TableCell>
                                    <TableCell>{company.phone}</TableCell>
                                    <TableCell>{company.status}</TableCell>
                                    <TableCell>
                                        <Button size="sm" onClick={() => openEdit(company)}>Edit</Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(company._id)}>Delete</Button>
                                        <Button size="sm" variant="secondary" onClick={() => openMembers(company)}>Members</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

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

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCompany ? "Edit Company" : "Create Company"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Name</Label>
                            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                        </div>
                        <div>
                            <Label>Phone</Label>
                            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                        </div>
                        <div>
                            <Label>Client Assignment</Label>
                            <select
                                className="w-full border rounded px-2 py-2"
                                value={(form as any).client || ""}
                                onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
                                required={!editingCompany}
                            >
                                <option value="" disabled>Select a Client...</option>
                                {clients.map(client => (
                                    <option key={client._id} value={client._id}>
                                        {client.name} ({client.companyName})
                                    </option>
                                ))}
                            </select>
                        </div>
                        {error && <div className="text-red-500 text-sm">{error}</div>}
                        <DialogFooter>
                            <Button type="submit" disabled={formLoading}>
                                {formLoading ? "Loading..." : editingCompany ? "Update" : "Create"}
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
        </Card>
    );
}
