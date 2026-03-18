"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCompliance } from "@/context/compliance-context";
import { useCompany } from "@/context/company-context";
import { complianceService } from "@/services/complianceService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateComplianceDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateComplianceDialog({ isOpen, onClose }: CreateComplianceDialogProps) {
    const { templates, fetchCompliances, fetchStats } = useCompliance();
    const { companies, selectedCompany } = useCompany();
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        companyId: "",
        serviceType: "",
        category: "",
        department: "Other",
        dueDate: "",
        risk: "LOW",
        isMandatory: false,
        price: "",
    });

    useEffect(() => {
        if (selectedCompany) {
            setFormData(prev => ({ ...prev, companyId: selectedCompany._id }));
        }
    }, [selectedCompany]);

    const handleTemplateSelect = (templateId: string) => {
        const template = templates.find(t => t._id === templateId);
        if (template) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + (template.daysUntilDue || 30));
            
            setFormData({
                ...formData,
                serviceType: template.serviceType,
                category: template.category || "",
                department: template.department,
                dueDate: dueDate.toISOString().split("T")[0],
                risk: template.risk,
                isMandatory: template.isMandatory,
                price: ""
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.companyId || !formData.serviceType || !formData.category || !formData.dueDate) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            await complianceService.createCompliance(formData);
            // ✅ Sync across all modules (Calendar, Dashboard, etc.)
            window.dispatchEvent(new CustomEvent('app:sync-compliance'));
            window.dispatchEvent(new CustomEvent('app:sync-calendar'));
            toast.success("Compliance assigned successfully");
            fetchCompliances(selectedCompany?._id, true);
            fetchStats(selectedCompany?._id, true);
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to assign compliance");
        } finally {
            setLoading(false);
        }
    };

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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign New Compliance</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {/* Template Selection */}
                    <div className="space-y-1">
                        <Label className="text-xs">Quick Fill from Template</Label>
                        <Select onValueChange={handleTemplateSelect}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map(t => (
                                    <SelectItem key={t._id} value={t._id}>{t.serviceType} ({t.department})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs">Company *</Label>
                        <Select 
                            value={formData.companyId} 
                            onValueChange={(val) => setFormData({ ...formData, companyId: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select company" />
                            </SelectTrigger>
                            <SelectContent>
                                {companies.map(c => (
                                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs">Compliance Name *</Label>
                        <Input 
                            value={formData.serviceType}
                            onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                            placeholder="e.g. GST Monthly Filing"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs">Department *</Label>
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
                        <div className="space-y-1">
                            <Label className="text-xs">Category *</Label>
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
                        <div className="space-y-1">
                            <Label className="text-xs">Risk Level</Label>
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
                        <div className="space-y-1">
                            <Label className="text-xs">Due Date *</Label>
                            <Input 
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs">Price (₹)</Label>
                        <Input 
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            placeholder="0"
                            min={0}
                        />
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                        <div className="space-y-0.5">
                            <Label className="text-sm">Mandatory Compliance</Label>
                            <p className="text-[10px] text-slate-500">Enable this to show 'Mandatory' badge on the dashboard</p>
                        </div>
                        <Switch 
                            checked={formData.isMandatory}
                            onCheckedChange={(val) => setFormData({ ...formData, isMandatory: val })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                        <Button type="submit" className="bg-[#002A52] hover:bg-[#001f3f]" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Assign Compliance
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
