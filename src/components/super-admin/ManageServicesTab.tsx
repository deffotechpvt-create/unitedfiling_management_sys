"use client";

import { useState, useMemo } from "react";
import { useService } from "@/context/service-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit2, Loader2, Search, ShoppingBag, Sparkles } from "lucide-react";
import { Service } from "@/services/serviceService";

const SERVICE_CATALOG: Record<string, string[]> = {
    "Licenses": [
        "Business license application & renewal",
        "Industry-specific permits (e.g., manufacturing, food, healthcare)",
        "Regulatory compliance audits for licenses",
        "License transfer or amendment services"
    ],
    "Trademarks": [
        "Trademark search & clearance",
        "Filing & registration of trademarks",
        "Trademark renewal & maintenance",
        "Opposition & infringement advisory"
    ],
    "Company Changes": [
        "Name change filings",
        "Incorporation or dissolution procedures",
        "Mergers & acquisitions assistance",
        "Share capital alterations & restructuring"
    ],
    "Taxation": [
        "Corporate tax filing & advisory",
        "GST/VAT registration & compliance",
        "Tax audit & assessment support",
        "Incentive & exemption claim assistance"
    ]
};

const CATEGORIES = Object.keys(SERVICE_CATALOG);

export function ManageServicesTab() {
    const { services, loading, createService, updateService, deleteService } = useService();
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        category: "",
        serviceType: "",
        price: 0,
        description: "",
        benefits: [""]
    });

    const filteredServices = useMemo(() => {
        return services.filter(s =>
            s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.serviceType.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [services, searchQuery]);

    const handleOpenDialog = (service?: Service) => {
        if (service) {
            setEditingService(service);
            setFormData({
                title: service.title,
                category: service.category,
                serviceType: service.serviceType,
                price: service.price,
                description: service.description || "",
                benefits: service.benefits.length > 0 ? service.benefits : [""]
            });
        } else {
            setEditingService(null);
            setFormData({
                title: "",
                category: "",
                serviceType: "",
                price: 0,
                description: "",
                benefits: [""]
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingService) {
                await updateService(editingService._id, formData);
            } else {
                await createService(formData);
            }
            setIsDialogOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this service?")) {
            await deleteService(id);
        }
    };

    const addBenefit = () => {
        setFormData(prev => ({ ...prev, benefits: [...prev.benefits, ""] }));
    };

    const updateBenefit = (index: number, value: string) => {
        const newBenefits = [...formData.benefits];
        newBenefits[index] = value;
        setFormData(prev => ({ ...prev, benefits: newBenefits }));
    };

    const removeBenefit = (index: number) => {
        const newBenefits = formData.benefits.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, benefits: newBenefits.length > 0 ? newBenefits : [""] }));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search services..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto bg-slate-900">
                    <Plus className="mr-2 h-4 w-4" /> Add New Service
                </Button>
            </div>

            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-blue-600" />
                        Service Catalog ({filteredServices.length})
                    </CardTitle>
                    <CardDescription>Manage your platform's service offerings and pricing.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading && services.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                    ) : filteredServices.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                           <p>No services found matching your search.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Service Title</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Service Type</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredServices.map((service) => (
                                        <TableRow key={service._id} className="group">
                                            <TableCell className="font-medium">{service.title}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{service.category}</Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-500 max-w-[200px] truncate">
                                                {service.serviceType}
                                            </TableCell>
                                            <TableCell className="font-semibold text-slate-900">
                                                ₹{service.price.toLocaleString('en-IN')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={service.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                                                    {service.isActive !== false ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(service)}>
                                                        <Edit2 className="h-4 w-4 text-blue-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(service._id)}>
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-blue-600" />
                                {editingService ? "Edit Service" : "Add New Service Offering"}
                            </DialogTitle>
                            <DialogDescription>
                                Fill in the details to {editingService ? "update" : "create"} a service on the marketplace.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(val) => setFormData({ ...formData, category: val, serviceType: "" })}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="serviceType">Service Type</Label>
                                    <Select
                                        value={formData.serviceType}
                                        onValueChange={(val) => setFormData({ ...formData, serviceType: val })}
                                        disabled={!formData.category}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {formData.category && SERVICE_CATALOG[formData.category].map(type => (
                                                <SelectItem key={type} value={type}>{type}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Display Title</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. Premium GST Registration"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price (₹)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        placeholder="999"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Briefly describe what this service provides..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Service Benefits & Features</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addBenefit}>
                                        <Plus className="h-3 w-3 mr-1" /> Add
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {formData.benefits.map((benefit, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                placeholder="e.g. Free pan card application"
                                                value={benefit}
                                                onChange={(e) => updateBenefit(index, e.target.value)}
                                            />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeBenefit(index)}>
                                                <Trash2 className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="sticky bottom-0 bg-white pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-slate-900" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingService ? "Update Service" : "Create Service"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
