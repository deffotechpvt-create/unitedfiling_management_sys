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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useClient } from "@/context/client-context";
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
import { Loader2 } from "lucide-react";
import { isUser } from "@/lib/roles";

export default function UserCompanyPage() {
    const { user, loading: authLoading } = useAuth();
    const {
        companies,
        createCompany,
        updateCompany,
        loading,
        refreshAll: refreshCompanies,
    } = useCompany();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [form, setForm] = useState({ name: "", email: "", phone: "", client: "" });
    const { clients, loading: clientsLoading } = useClient();
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [membersDialogOpen, setMembersDialogOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

    // Guard: show loading if auth is loading or user is not present
    if (authLoading || !user) {
        return (
            <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Only show companies where user is a member
    const userCompanies = companies.filter((c) =>
        c.members?.some(
            (m) =>
                (typeof m.user === "object" ? m.user._id : m.user) === user._id
        )
    );

    // Handle open for create/edit

    const openCreate = () => {
        setForm({ name: "", email: "", phone: "", client: "" });
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
    // Handle open members dialog
    const openMembers = (company: Company) => {
        setSelectedCompany(company);
        setMembersDialogOpen(true);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Your Companies</CardTitle>
                <Button onClick={openCreate}>Create Company</Button>
            </CardHeader>
            <CardContent>
                {loading && userCompanies.length === 0 ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : userCompanies.length === 0 ? (
                    <div className="text-muted-foreground text-sm py-8 text-center">
                        No companies found. Create one to get started.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {userCompanies.map((company) => {
                                const isOwner = company.members?.some(
                                    (m) =>
                                        (typeof m.user === "object" ? m.user._id : m.user) === user?._id && m.role === "OWNER"
                                );
                                return (
                                    <TableRow key={company._id}>
                                        <TableCell>{company.name}</TableCell>
                                        <TableCell>{company.email}</TableCell>
                                        <TableCell>{company.phone}</TableCell>
                                        <TableCell>{company.status}</TableCell>
                                        <TableCell>{company.fullAddress}</TableCell>
                                        <TableCell className="flex items-center gap-2">
                                            {isOwner && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => openEdit(company)}
                                                    >
                                                    Edit
                                                </Button>
                                            )}
                                            {/* Delete button is intentionally hidden for USER role — backend also enforces this */}
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => openMembers(company)}
                                            >
                                                Members
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingCompany ? "Edit Company" : "Create Company"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Name</Label>
                            <Input
                                value={form.name}
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
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, email: e.target.value }))
                                }
                            />
                        </div>
                        <div>
                            <Label>Phone</Label>
                            <Input
                                value={form.phone}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, phone: e.target.value }))
                                }
                            />
                        </div>
                        {/* Client Selector (Hidden for USER) */}
                        {!isUser(user?.role) && (
                            <div>
                                <Label>Client</Label>
                                <select
                                    className="w-full border rounded px-2 py-2 border-slate-200"
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
                        {error && (
                            <div className="text-red-500 text-sm">{error}</div>
                        )}
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                disabled={formLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={formLoading}>
                                {formLoading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {editingCompany ? "Updating..." : "Creating..."}
                                    </span>
                                ) : editingCompany ? (
                                    "Update"
                                ) : (
                                    "Create"
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
        </Card>
    );
}
