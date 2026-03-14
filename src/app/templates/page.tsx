"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useCompliance } from "@/context/compliance-context";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { ROLES } from "@/lib/roles";
import { toast } from "sonner";

export default function TemplatesPage() {
    const { templates, fetchTemplates, createTemplate, updateTemplate, deleteTemplate, loading } = useCompliance();
    const [searchTerm, setSearchTerm] = useState("");
    
    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

    // Form state
    const [formData, setFormData] = useState({
        serviceType: "",
        category: "",
        department: "Direct Tax",
        frequency: "Annual",
        daysUntilDue: 30,
        risk: "LOW",
        isMandatory: true,
        description: ""
    });

    const categoriesMap: Record<string, string[]> = {
        "Direct Tax": ["TDS", "ITR"],
        "GST": ["GST Filing", "GSTR-1", "GSTR-3B"],
        "Corporate Secretarial": ["Incorporation", "Compliance"],
        "HR/ Labour Compliance": ["Payroll", "ESI"],
        "Accounts Department": ["Bookkeeping", "Auditing"],
        "Other": ["General"]
    };

    const handleDeptChange = (val: string) => {
        setFormData(prev => ({ 
            ...prev, 
            department: val,
            category: categoriesMap[val]?.[0] || "" 
        }));
    };

    useEffect(() => {
        fetchTemplates(true);
    }, [fetchTemplates]);

    const handleOpenCreate = () => {
        setFormData({
            serviceType: "",
            category: "TDS",
            department: "Direct Tax",
            frequency: "Annual",
            daysUntilDue: 30,
            risk: "LOW",
            isMandatory: true,
            description: ""
        });
        setIsCreateOpen(true);
    };

    const handleOpenEdit = (template: any) => {
        setSelectedTemplate(template);
        setFormData({
            serviceType: template.serviceType || "",
            category: template.category || "",
            department: template.department || "Other",
            frequency: template.frequency || "Annual",
            daysUntilDue: template.daysUntilDue || 30,
            risk: template.risk || "LOW",
            isMandatory: template.isMandatory ?? true,
            description: template.description || ""
        });
        setIsEditOpen(true);
    };

    const handleOpenDelete = (template: any) => {
        setSelectedTemplate(template);
        setIsDeleteOpen(true);
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.serviceType.trim()) {
            toast.error("Template Name is required");
            return;
        }
        await createTemplate(formData);
        setIsCreateOpen(false);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.serviceType.trim()) {
            toast.error("Template Name is required");
            return;
        }
        await updateTemplate(selectedTemplate._id, formData);
        setIsEditOpen(false);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedTemplate) return;
        await deleteTemplate(selectedTemplate._id);
        setIsDeleteOpen(false);
    };

    const filteredTemplates = templates.filter(t => 
        t.serviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <RoleGuard allowedRoles={[ROLES.SUPER_ADMIN]}>
            <div className="space-y-6 p-6 h-full flex flex-col">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Compliance Templates</h1>
                        <p className="text-sm text-slate-500 mt-1">Manage global templates for compliance assignments.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search templates by name or department..."
                            className="pl-9 bg-slate-50 border-slate-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleOpenCreate} className="bg-[#002A52] hover:bg-[#001f3f] w-full sm:w-auto shadow-sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Template
                    </Button>
                </div>

                {/* Templates Table */}
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex-1">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50 border-b">
                                <TableRow>
                                    <TableHead className="font-semibold text-slate-700">Template Name</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Category</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Department</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Risk Level</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-center">Due Days</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-center">Mandatory</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTemplates.length > 0 ? (
                                    filteredTemplates.map((template) => (
                                        <TableRow key={template._id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-medium text-slate-900">{template.serviceType}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-normal">
                                                    {template.category || "-"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{template.department}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`
                                                        ${template.risk === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                                        ${template.risk === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                                        ${template.risk === 'LOW' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                                    `}
                                                >
                                                    {template.risk}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">{template.daysUntilDue} days</TableCell>
                                            <TableCell className="text-center">
                                                {template.isMandatory ? 
                                                    <span className="inline-flex items-center justify-center p-1 bg-blue-50 text-blue-700 rounded-full">
                                                        <ShieldAlert className="h-4 w-4" />
                                                    </span> 
                                                : '-'}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(template)} className="h-8 w-8 text-slate-500 hover:text-blue-600">
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(template)} className="h-8 w-8 text-slate-500 hover:text-red-600">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                            {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" /> : "No compliance templates found."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Create/Edit Modal uses same form but different submit handles */}
                <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
                    if (!open) {
                        setIsCreateOpen(false);
                        setIsEditOpen(false);
                        setSelectedTemplate(null);
                    }
                }}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{isEditOpen ? "Edit Template" : "Create New Template"}</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={isEditOpen ? handleEditSubmit : handleCreateSubmit} className="space-y-4 py-4">
                            <div className="space-y-1.5">
                                <Label>Template Name *</Label>
                                <Input 
                                    value={formData.serviceType}
                                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                                    placeholder="e.g. GST Monthly Filing"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Department *</Label>
                                    <Select 
                                        value={formData.department} 
                                        onValueChange={handleDeptChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Direct Tax">Direct Tax</SelectItem>
                                            <SelectItem value="GST">GST</SelectItem>
                                            <SelectItem value="Corporate Secretarial">ROC / Secretarial</SelectItem>
                                            <SelectItem value="HR/ Labour Compliance">HR / Labour</SelectItem>
                                            <SelectItem value="Accounts Department">Accounts</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Category *</Label>
                                    <Select 
                                        key={formData.department}
                                        value={formData.category} 
                                        onValueChange={(val) => setFormData({ ...formData, category: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(categoriesMap[formData.department] || ["General"]).map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Frequency</Label>
                                    <Select 
                                        value={formData.frequency} 
                                        onValueChange={(val) => setFormData({ ...formData, frequency: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Monthly">Monthly</SelectItem>
                                            <SelectItem value="Quarterly">Quarterly</SelectItem>
                                            <SelectItem value="Annual">Annual</SelectItem>
                                            <SelectItem value="One-time">One-time</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Risk Level</Label>
                                    <Select 
                                        value={formData.risk} 
                                        onValueChange={(val) => setFormData({ ...formData, risk: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="LOW">Low</SelectItem>
                                            <SelectItem value="MEDIUM">Medium</SelectItem>
                                            <SelectItem value="HIGH">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Default Due Days</Label>
                                    <Input 
                                        type="number"
                                        min="0"
                                        value={formData.daysUntilDue}
                                        onChange={(e) => setFormData({ ...formData, daysUntilDue: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Description</Label>
                                    <Input 
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Optional description"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 border rounded-lg mt-2">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-medium">Mandatory Compliance</Label>
                                    <p className="text-xs text-slate-500">Enable this to mark the template as a mandatory compliance requirement.</p>
                                </div>
                                <Switch 
                                    checked={formData.isMandatory}
                                    onCheckedChange={(val) => setFormData({ ...formData, isMandatory: val })}
                                />
                            </div>

                            <DialogFooter className="pt-4">
                                <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>Cancel</Button>
                                <Button type="submit" className="bg-[#002A52] hover:bg-[#001f3f]">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    {isEditOpen ? 'Update Template' : 'Create Template'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent className="max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Delete Template</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 text-slate-600 text-sm">
                            Are you sure you want to delete the template <strong>{selectedTemplate?.serviceType}</strong>? This action cannot be undone.
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </RoleGuard>
    );
}
