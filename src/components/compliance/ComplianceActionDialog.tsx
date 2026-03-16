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
import { paymentService } from "@/services/paymentService";
import { useDocument } from "@/context/document-context"

const STATUS_RANK: Record<string, number> = {
    'PENDING': 0,
    'PAYMENT_DONE': 1,
    'NEEDS_ACTION': 2,
    'IN_PROGRESS': 3,
    'WAITING_FOR_CLIENT': 4,
    'FILING_DONE': 5,
    'COMPLETED': 6,
    'DELAYED': 0.5,
    'OVERDUE': 0.5,
};
import { toast } from "sonner";
import { 
    FileText, 
    Upload, 
    Loader2, 
    Trash2, 
    Download, 
    Calendar, 
    AlertCircle, 
    User as UserIcon,
    CreditCard,
    CheckCircle2,
    Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isSuperAdmin } from "@/lib/roles";

interface ComplianceActionDialogProps {
    compliance: any;
    isOpen: boolean;
    onClose: () => void;
}

// Ensure Razorpay object is available on window
declare global {
    interface Window {
        Razorpay: any;
    }
}

export function ComplianceActionDialog({ compliance, isOpen, onClose }: ComplianceActionDialogProps) {
    const { user } = useAuth();
    const { updateCompliance, admins, compliances, refreshAll, deleteCompliances } = useCompliance();
    const { uploadDocument } = useDocument();
    const [isUploading, setIsUploading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [note, setNote] = useState("");
    const [updating, setUpdating] = useState(false);
    const [pendingChanges, setPendingChanges] = useState<any>({});
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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

    // Load Razorpay Script dynamically only when needed
    useEffect(() => {
        if (isOpen && activeCompliance?.price > 0 && activeCompliance?.payment?.status !== 'PAID') {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);

            return () => {
                document.body.removeChild(script);
            };
        }
    }, [isOpen, activeCompliance]);

    if (!activeCompliance) return null;

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        try {
            const success = await uploadDocument({
                file,
                relatedComplianceId: activeCompliance._id,
                companyId: typeof activeCompliance.company === "string" ? activeCompliance.company : activeCompliance.company?._id,
                folder: "Compliances",
                description: `Document for ${activeCompliance.serviceType} - ${note}`
            });
            if (success) {
                setFile(null);
                setNote("");
            }
        } catch (error: any) {
            // Already handled in context but keeping try/catch for safety
        } finally {
            setIsUploading(false);
        }
    };

    const handlePayment = async () => {
        if (!window.Razorpay) {
            toast.error("Payment system is currently unavailable. Please try again later.");
            return;
        }

        setIsProcessingPayment(true);
        try {
            // 1. Create Order on Backend
            const orderData = await paymentService.createOrder(activeCompliance._id, 'COMPLIANCE');

            // 2. Open Razorpay Checkout Modal
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "United Fillings",
                description: `Payment for Compliance: ${activeCompliance.serviceType}`,
                order_id: orderData.orderId,
                handler: async function (response: any) {
                    try {
                        const loadingToastId = toast.loading("Verifying payment...");
                        
                        // 3. Verify Payment Signature and Update Backend
                        await paymentService.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            entityId: activeCompliance._id,
                            entityType: 'COMPLIANCE'
                        });

                        toast.success("Payment successful! Compliance updated.", { id: loadingToastId });
                        window.dispatchEvent(new CustomEvent('app:sync-data')); // global sync
                        await refreshAll(undefined, true); // force list refresh
                    } catch (err: any) {
                        console.error("Payment Verification Failed:", err);
                        toast.error(err.response?.data?.message || "Payment verification failed.");
                    }
                },
                prefill: {
                    name: user?.name || "",
                    email: user?.email || "",
                    contact: user?.phone || ""
                },
                theme: {
                    color: "#002A52"
                },
                modal: {
                    ondismiss: function() {
                        setIsProcessingPayment(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                toast.error(`Payment failed: ${response.error.description}`);
                setIsProcessingPayment(false);
            });

            rzp.open();
        } catch (error: any) {
            console.error("Payment Initiation Failed:", error);
            toast.error(error.response?.data?.message || "Could not initiate payment.");
            setIsProcessingPayment(false);
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
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            {activeCompliance.serviceType}
                            {activeCompliance.price > 0 && activeCompliance.payment?.status === 'PAID' && (
                                <Badge className="bg-green-100 text-green-800 border-green-200 gap-1 uppercase tracking-wider text-[10px] ml-2 font-bold pointer-events-none">
                                    <CheckCircle2 className="h-3 w-3" /> Paid
                                </Badge>
                            )}
                        </DialogTitle>
                        <Badge className={cn(
                            "ml-2",
                            activeCompliance.status === "COMPLETED" || activeCompliance.status === "FILING_DONE" || activeCompliance.status === "PAYMENT_DONE" ? "bg-green-500" :
                            activeCompliance.status === "DELAYED" || activeCompliance.status === "OVERDUE" ? "bg-red-500" : "bg-blue-500"
                        )}>
                            {activeCompliance.status.replace(/_/g, ' ')}
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
                                    <>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Compliance Name / Service Type</Label>
                                            <Input 
                                                value={activeCompliance.serviceType}
                                                onChange={(e) => handleFieldChange({ serviceType: e.target.value })}
                                                placeholder="Service Type"
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Department</Label>
                                            <Select 
                                                value={activeCompliance.department} 
                                                onValueChange={(val) => handleFieldChange({ department: val })}
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Direct Tax">Direct Tax</SelectItem>
                                                    <SelectItem value="GST">GST</SelectItem>
                                                    <SelectItem value="Corporate Secretarial">Corporate Secretarial</SelectItem>
                                                    <SelectItem value="HR/ Labour Compliance">HR/ Labour Compliance</SelectItem>
                                                    <SelectItem value="Accounts Department">Accounts Department</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Category</Label>
                                            <Input 
                                                value={activeCompliance.category || ""}
                                                onChange={(e) => handleFieldChange({ category: e.target.value })}
                                                placeholder="Category (e.g. TDS, ITR)"
                                                className="h-9"
                                            />
                                        </div>
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
                                    </>
                                )}
                                {!isSuperAdmin(user?.role) && (
                                    <div className="space-y-1">
                                        <Label className="text-xs">Expert (Read-only)</Label>
                                        <div className="text-sm font-medium p-2 bg-slate-50 border rounded-md">{activeCompliance.expertName || "Unassigned"}</div>
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
                                            <SelectItem value="PENDING" disabled={STATUS_RANK['PENDING'] < STATUS_RANK[activeCompliance.status]}>Pending</SelectItem>
                                            <SelectItem value="NEEDS_ACTION" disabled={STATUS_RANK['NEEDS_ACTION'] < STATUS_RANK[activeCompliance.status]}>Needs Action</SelectItem>
                                            <SelectItem value="IN_PROGRESS" disabled={STATUS_RANK['IN_PROGRESS'] < STATUS_RANK[activeCompliance.status]}>In Progress</SelectItem>
                                            <SelectItem value="WAITING_FOR_CLIENT" disabled={STATUS_RANK['WAITING_FOR_CLIENT'] < STATUS_RANK[activeCompliance.status]}>Waiting For Client</SelectItem>
                                            <SelectItem value="COMPLETED" disabled={STATUS_RANK['COMPLETED'] < STATUS_RANK[activeCompliance.status]}>Completed</SelectItem>
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
                            {activeCompliance.attachments && activeCompliance.attachments.map((att: any, idx: number) => {
                                const isObject = typeof att === 'object' && att !== null;
                                const url = isObject ? att.url : att;
                                const storedName = isObject ? att.name : null;
                                const fileName = storedName || url.split('/').pop()?.split('?')[0] || `Document ${idx + 1}`;
                                
                                return (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-white border rounded text-xs group hover:border-blue-200 transition-colors">
                                        <div className="flex items-center gap-2 truncate pr-2">
                                            <FileText className="h-3 w-3 text-blue-500" />
                                            <span className="truncate font-medium">{decodeURIComponent(fileName)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors">
                                                <Eye className="h-3.5 w-3.5" />
                                            </a>
                                            <a href={url} target="_blank" rel="noopener noreferrer" download className="text-slate-400 hover:text-blue-600 transition-colors">
                                                <Download className="h-3.5 w-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <DialogFooter className="sm:justify-between items-center">
                    <div className="flex items-center gap-2">
                        {/* Pay Now Button for Users */}
                        {!canManageStatus && activeCompliance.price > 0 && activeCompliance.payment?.status !== 'PAID' && (
                            <Button 
                                className="bg-green-600 hover:bg-green-700 text-white gap-2 font-bold px-6"
                                onClick={handlePayment}
                                disabled={isProcessingPayment}
                            >
                                {isProcessingPayment ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CreditCard className="h-4 w-4" />
                                )}
                                Pay Now (₹{activeCompliance.price})
                            </Button>
                        )}

                        {isSuperAdmin(user?.role) && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-1"
                                onClick={async () => {
                                    if (window.confirm("Are you sure you want to delete this compliance record? This cannot be undone.")) {
                                        setUpdating(true);
                                        try {
                                            await deleteCompliances([activeCompliance._id]);
                                            onClose();
                                        } catch (err) {
                                            console.error("Delete failed:", err);
                                        } finally {
                                            setUpdating(false);
                                        }
                                    }
                                }}
                                disabled={updating}
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete Compliance
                            </Button>
                        )}
                        {Object.keys(pendingChanges).length > 0 && (
                            <Button 
                                variant="default" 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 h-8"
                                onClick={async () => {
                                    setUpdating(true);
                                    try {
                                        await updateCompliance(activeCompliance._id, pendingChanges);
                                        setPendingChanges({});
                                    } catch (err) {
                                        console.error("Save failed:", err);
                                    } finally {
                                        setUpdating(false);
                                    }
                                }}
                                disabled={updating}
                            >
                                {updating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                Save Changes
                            </Button>
                        )}
                    </div>
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
