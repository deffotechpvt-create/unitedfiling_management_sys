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
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/auth-context";
import { useCompliance } from "@/context/compliance-context";
import { documentService } from "@/services/documentService";
import { toast } from "sonner";
import { 
    FileText, 
    Upload, 
    Loader2, 
    Trash2, 
    Download, 
    Calendar, 
    AlertCircle, 
    User as UserIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isSuperAdmin } from "@/lib/roles";

interface ComplianceActionDialogProps {
    compliance: any;
    isOpen: boolean;
    onClose: () => void;
}

export function ComplianceActionDialog({ compliance, isOpen, onClose }: ComplianceActionDialogProps) {
    const { user } = useAuth();
    const { updateCompliance, admins, compliances, refreshAll } = useCompliance();
    const [isUploading, setIsUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [note, setNote] = useState("");
    const [updating, setUpdating] = useState(false);
    const [pendingChanges, setPendingChanges] = useState<any>({});

    const canManageStatus = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

    // Track real-time context updates and merge with local pending changes
    const activeCompliance = React.useMemo(() => {
        const fromContext = compliances.find(c => c._id === compliance?._id) || compliance;
        if (!fromContext) return null;
        return { ...fromContext, ...pendingChanges };
    }, [compliances, compliance, pendingChanges]);

    // Reset pending changes when dialog opens
    useEffect(() => {
        if (isOpen) {
            setPendingChanges({});
        }
    }, [isOpen]);

    if (!activeCompliance) return null;

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        try {
            await documentService.uploadDocument({
                file,
                relatedComplianceId: activeCompliance._id,
                companyId: typeof activeCompliance.company === "string" ? activeCompliance.company : activeCompliance.company?._id,
                folder: "Compliances",
                description: `Document for ${activeCompliance.serviceType} - ${note}`
            });
            toast.success("Document uploaded successfully");
            setFile(null);
            setNote("");
            await refreshAll(undefined, true); // Instantly fetch latest attachments
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to upload document");
        } finally {
            setIsUploading(false);
        }
    };

    const handleFieldChange = (fields: any) => {
        setPendingChanges((prev: any) => ({ ...prev, ...fields }));
    };

    const handleOpenChange = async (open: boolean) => {
        if (!open) {
            // Check if there are changes to save
            if (Object.keys(pendingChanges).length > 0) {
                setUpdating(true);
                try {
                    await updateCompliance(activeCompliance._id, pendingChanges);
                } catch (error) {
                    console.error("Auto-save on close failed:", error);
                } finally {
                    setUpdating(false);
                    setPendingChanges({});
                }
            }
            onClose();
        }
    };

    const handleUpdate = async (fields: any) => {
        setUpdating(true);
        try {
            await updateCompliance(activeCompliance._id, fields);
            // toast success is handled in context
        } catch (error) {
            // error handled in context
        } finally {
            setUpdating(false);
        }
    };

    const dueDate = new Date(activeCompliance.dueDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-bold">{activeCompliance.serviceType}</DialogTitle>
                        <Badge className={cn(
                            "ml-2",
                            activeCompliance.status === "COMPLETED" || activeCompliance.status === "FILING_DONE" ? "bg-green-500" :
                            activeCompliance.status === "DELAYED" || activeCompliance.status === "OVERDUE" ? "bg-red-500" : "bg-blue-500"
                        )}>
                            {activeCompliance.status}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    {/* Details Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                            <Calendar className="h-4 w-4" />
                            <span>Due Date: <span className="font-semibold text-slate-900">{dueDate}</span></span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                            <FileText className="h-4 w-4" />
                            <span>Department: <span className="font-medium">{activeCompliance.department}</span></span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                            <AlertCircle className="h-4 w-4" />
                            <span>Risk Level: <span className={cn(
                                "font-bold",
                                activeCompliance.risk === "HIGH" ? "text-red-500" : 
                                activeCompliance.risk === "MEDIUM" ? "text-orange-500" : "text-green-500"
                            )}>{activeCompliance.risk}</span></span>
                        </div>
                        {activeCompliance.expertName && (
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <UserIcon className="h-4 w-4" />
                                <span>Expert: <span className="font-medium">{activeCompliance.expertName}</span></span>
                            </div>
                        )}

                        {/* Status/Stage management for Admins */}
                        {canManageStatus && (
                            <div className="pt-4 border-t space-y-3">
                                {isSuperAdmin(user?.role) && (
                                    <div className="space-y-1">
                                        <Label className="text-xs">Assign Expert</Label>
                                        <Select 
                                            value={typeof activeCompliance.assignedTo === "object" ? activeCompliance.assignedTo?._id : (activeCompliance.assignedTo || "unassigned")}
                                            onValueChange={(val) => {
                                                if (val === "unassigned") {
                                                    handleFieldChange({ assignedTo: null as any, expertName: "Unassigned" });
                                                } else if (val) {
                                                    const admin = admins.find((a) => a._id === val);
                                                    handleFieldChange({ assignedTo: val, expertName: admin?.name });
                                                }
                                            }}
                                            disabled={updating}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Select an expert" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                                {admins.map((a) => (
                                                    <SelectItem key={a._id} value={a._id}>{a.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <Label className="text-xs">Update Status</Label>
                                    <Select 
                                        value={activeCompliance.status} 
                                        onValueChange={(val) => handleFieldChange({ status: val })}
                                        disabled={updating}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                            <SelectItem value="NEEDS_ACTION">Needs Action</SelectItem>
                                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                            <SelectItem value="WAITING_FOR_CLIENT">Waiting For Client</SelectItem>
                                            <SelectItem value="COMPLETED">Completed</SelectItem>
                                            <SelectItem value="DELAYED">Delayed</SelectItem>
                                            <SelectItem value="OVERDUE">Overdue</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Update Stage</Label>
                                    <Select 
                                        value={activeCompliance.stage} 
                                        onValueChange={(val) => handleFieldChange({ stage: val })}
                                        disabled={updating}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PAYMENT">Payment</SelectItem>
                                            <SelectItem value="DOCUMENTATION">Documentation</SelectItem>
                                            <SelectItem value="GOVT_APPROVAL">Govt Approval</SelectItem>
                                            <SelectItem value="FILING_DONE">Filing Done</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Upload Column */}
                    <div className="bg-slate-50 p-4 rounded-lg space-y-4 border border-dashed border-slate-300">
                        <div className="flex items-center gap-2 font-semibold text-slate-800">
                            <Upload className="h-4 w-4" />
                            <span>Upload Document</span>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label htmlFor="file-upload" className="text-xs text-slate-500">File (PDF, Image, Doc)</Label>
                                <Input 
                                    id="file-upload" 
                                    type="file" 
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="h-9 text-xs bg-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="note" className="text-xs text-slate-500">Add a note (optional)</Label>
                                <Input 
                                    id="note" 
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="e.g. Uploaded invoice"
                                    className="h-9 text-xs bg-white"
                                />
                            </div>
                            <Button 
                                className="w-full bg-[#002A52] hover:bg-[#001f3f] h-9" 
                                onClick={handleUpload}
                                disabled={!file || isUploading}
                            >
                                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Document"}
                            </Button>
                        </div>
                        
                        <div className="text-[10px] text-slate-400">
                            * Max file size 10MB. Files will be accessible by our compliance experts.
                        </div>
                    </div>
                </div>

                {/* Attachments Preview */}
                {activeCompliance.attachments && activeCompliance.attachments.length > 0 && (
                    <div className="pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-2">Existing Attachments</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {activeCompliance.attachments.map((url: string, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-white border rounded text-xs">
                                    <div className="flex items-center gap-2 truncate pr-2">
                                        <FileText className="h-3 w-3 text-blue-500" />
                                        <span className="truncate">Document {idx + 1}</span>
                                    </div>
                                    <a href={url} target="_blank" rel="noopener noreferrer" download className="text-blue-600 hover:underline">
                                        <Download className="h-3 w-3" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <DialogFooter className="sm:justify-start">
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
