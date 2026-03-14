"use client";

import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useCompliance } from "@/context/compliance-context";
import { complianceService } from "@/services/complianceService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateTemplateDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateTemplateDialog({ isOpen, onClose }: CreateTemplateDialogProps) {
    const { fetchTemplates } = useCompliance();
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        serviceType: "",
        category: "",
        department: "Direct Tax",
        frequency: "Monthly",
        daysUntilDue: 30,
        risk: "LOW",
        isMandatory: true,
        description: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.serviceType || !formData.category || !formData.department || !formData.frequency) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            await complianceService.createTemplate(formData);
            toast.success("Compliance template created successfully");
            fetchTemplates(true);
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create template");
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
                    <DialogTitle>Create Compliance Template</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-1">
                        <Label className="text-xs">Template Name *</Label>
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
                            <Label className="text-xs">Frequency *</Label>
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
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs">Days Until Submission *</Label>
                            <Input 
                                type="number"
                                value={formData.daysUntilDue}
                                onChange={(e) => setFormData({ ...formData, daysUntilDue: parseInt(e.target.value) })}
                                min={1}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Default Risk Level</Label>
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

                    <div className="space-y-1">
                        <Label className="text-xs">Template Description</Label>
                        <Textarea 
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Details about submission process..."
                            className="h-20"
                        />
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                        <div className="space-y-0.5">
                            <Label className="text-sm">Default Mandatory</Label>
                            <p className="text-[10px] text-slate-500">Enable this to mark as mandatory for all newly created companies</p>
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
                            Create Template
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
