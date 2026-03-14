"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useCompliance } from "@/context/compliance-context"
import { useCompany } from "@/context/company-context"
import { useAuth } from "@/context/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Trash2, Download, AlertCircle, X, ChevronDown, FileCheck2, RefreshCcw } from "lucide-react"
import { ComplianceActionDialog } from "@/components/compliance/ComplianceActionDialog"
import { CreateComplianceDialog } from "@/components/compliance/CreateComplianceDialog"
import { CreateTemplateDialog } from "@/components/compliance/CreateTemplateDialog"
import { toast } from "sonner"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export function CompliancesPageClient() {
    const { selectedCompany } = useCompany()
    const { user } = useAuth();
    const {
        compliances,
        stats,
        refreshAll,
        globalSearch,
        loading: isLoading,
        error,
        deleteCompliances,
    } = useCompliance();

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    // Filters State
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [filterInternal, setFilterInternal] = useState(false)
    const [filterMandatory, setFilterMandatory] = useState(false)
    const [activeTab, setActiveTab] = useState("All")

    // Search Debouncing Logic
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        
        // If query is empty, update immediately for fast reset
        if (!searchQuery) {
            setDebouncedSearch("");
            return;
        }

        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 400); // 400ms debounce
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Filter Logic States
    const [selectedDept, setSelectedDept] = useState<string | null>(null)
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [tempCategories, setTempCategories] = useState<string[]>([]) // For the "Apply" pattern
    const [selectedDueDate, setSelectedDueDate] = useState<string | null>(null)

    // Options
    const departments = [
        "Direct Tax",
        "GST",
        "Corporate Secretarial",
        "HR/ Labour Compliance",
        "Accounts Department",
        "Other"
    ]

    const dueDates = [
        "This Week",
        "This Month",
        "Previous Month",
        "This Quarter",
        "Previous Quarter",
        "This Financial Year",
        "Previous Financial Year"
    ]

    const categoriesMap: Record<string, string[]> = {
        "Direct Tax": ["TDS", "ITR"],
        "GST": ["GST Filing", "GSTR-1", "GSTR-3B"],
        "Corporate Secretarial": ["Incorporation", "Compliance"],
        "HR/ Labour Compliance": ["Payroll", "ESI"],
        "Accounts Department": ["Bookkeeping", "Auditing"],
        "Other": ["General"]
    }

    // Reset filters on company change
    useEffect(() => {
        setSearchQuery("");
        setSelectedDept(null);
        setSelectedCategories([]);
        setTempCategories([]);
        // Keep activeTab and selectedDueDate as they are often persistent preferences
    }, [selectedCompany?._id]);

    const [selectedCompliance, setSelectedCompliance] = useState<any>(null);
    const [isActionOpen, setIsActionOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isTemplateOpen, setIsTemplateOpen] = useState(false);

    const isSuperAdmin = user?.role === "SUPER_ADMIN";
    const isAdmin = user?.role === "ADMIN";
    const canManage = isSuperAdmin || isAdmin;

    const handleDeptChange = useCallback((val: string) => {
        if (val === selectedDept) return;
        setSelectedDept(val);
        setSelectedCategories([]); // Reset categories when dept changes
        setTempCategories([]);
    }, [selectedDept]);

    const clearDept = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedDept(null);
        setSelectedCategories([]);
        setTempCategories([]);
    }, []);

    const clearDueDate = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedDueDate(null);
    }, []);

    const resetAllFilters = useCallback(() => {
        setSearchQuery("");
        setSelectedDept(null);
        setSelectedCategories([]);
        setTempCategories([]);
        setSelectedDueDate(null);
        setFilterInternal(false);
        setFilterMandatory(false);
    }, []);

    const toggleCategory = useCallback((cat: string) => {
        setTempCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
    }, []);

    const applyCategories = useCallback(() => {
        setSelectedCategories(tempCategories);
    }, [tempCategories]);

    // REAL-TIME BACKEND FETCHING
    useEffect(() => {
        const filters: any = {};
        const combinedSearch = globalSearch || debouncedSearch;
        if (combinedSearch) filters.search = combinedSearch;
        if (selectedDept) filters.department = selectedDept;
        if (selectedCategories.length > 0) filters.category = selectedCategories;

        refreshAll(selectedCompany?._id, false, filters);
    }, [debouncedSearch, globalSearch, selectedDept, selectedCategories, selectedCompany?._id, refreshAll]);

    const handleCategoryOpen = useCallback((open: boolean) => {
        if (open) {
            setTempCategories(selectedCategories)
        }
    }, [selectedCategories]);

    // Format Status Utility
    const formatComplianceStatus = (status: string) => {
        switch (status) {
            case 'PENDING': return 'Pending';
            case 'NEEDS_ACTION': return 'Needs Action';
            case 'IN_PROGRESS': return 'In Progress';
            case 'WAITING_FOR_CLIENT': return 'Waiting for Client';
            case 'DELAYED': return 'Delayed';
            case 'OVERDUE': return 'Overdue';
            case 'COMPLETED': return 'Completed';
            case 'FILING_DONE': return 'Filing Done';
            default: return status ? status.charAt(0) + status.slice(1).toLowerCase() : 'N/A';
        }
    };

    // Core Filter Engine - Phase 1: Filter by all EXCEPT activeTab for correct counts
    const filteredByCommonControls = useMemo(() => {
        return (compliances || []).filter((c: any) => {
            const dueDateObj = new Date(c.dueDate);
            const now = new Date();

            // 1. Search Filter (Already handled by backend, but keeping locally for instant UI response)
            const combinedSearch = (globalSearch || searchQuery).toLowerCase();
            if (combinedSearch) {
                const matchesName = c.serviceType?.toLowerCase().includes(combinedSearch);
                const matchesExpert = c.expertName?.toLowerCase().includes(combinedSearch);
                const matchesOffice = c.company?.name?.toLowerCase().includes(combinedSearch);
                if (!matchesName && !matchesExpert && !matchesOffice) return false;
            }

            // 2. Toggles
            if (filterMandatory && !(c.risk === "HIGH" || c.isMandatory)) return false;
            if (filterInternal && !c.isInternal) return false;

            // 3. Department Filter (Already handled by backend)
            if (selectedDept && c.department !== selectedDept) return false;

            // 4. Category Filter (Already handled by backend)
            if (selectedCategories.length > 0 && !selectedCategories.includes(c.category)) return false;

            // 5. Due Date Filter
            if (selectedDueDate) {
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);

                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

                if (selectedDueDate === "This Week") {
                    if (dueDateObj < startOfWeek || dueDateObj > endOfWeek) return false;
                } else if (selectedDueDate === "This Month") {
                    if (dueDateObj < startOfMonth || dueDateObj > endOfMonth) return false;
                } else if (selectedDueDate === "Previous Month") {
                    const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    const endPrev = new Date(now.getFullYear(), now.getMonth(), 0);
                    if (dueDateObj < startPrev || dueDateObj > endPrev) return false;
                }
            }

            return true;
        });
    }, [compliances, searchQuery, globalSearch, filterMandatory, filterInternal, selectedDept, selectedCategories, selectedDueDate]);

    // Calculate dynamic counts for tabs based on server stats
    const tabs = useMemo(() => {
        if (!stats) return [
            { name: "All", count: 0 },
            { name: "Pending", count: 0 },
            { name: "Needs action", count: 0 },
            { name: "In progress", count: 0 },
            { name: "Waiting For Client", count: 0 },
            { name: "Completed", count: 0 },
            { name: "Delayed", count: 0 },
            { name: "Overdue", count: 0 },
        ];

        return [
            { name: "All", count: stats.total || 0 },
            { name: "Pending", count: stats.pending || 0 },
            { name: "Needs action", count: stats.needsAction || 0 },
            { name: "In progress", count: stats.inProgress || 0 },
            { name: "Waiting For Client", count: stats.waitingForClient || 0 },
            { name: "Completed", count: stats.completed || 0 },
            { name: "Delayed", count: stats.delayed || 0 },
            { name: "Overdue", count: stats.overdue || 0 },
        ]
    }, [stats]);

    // Core Filter Engine - Phase 2: Final filter by activeTab
    const finalFilteredCompliances = useMemo(() => {
        return filteredByCommonControls.filter((c: any) => {
            if (activeTab === "Pending") {
                return c.status === "PENDING";
            } else if (activeTab === "Needs action") {
                return c.status === "NEEDS_ACTION";
            } else if (activeTab === "In progress") {
                return c.status === "IN_PROGRESS";
            } else if (activeTab === "Waiting For Client") {
                return c.status === "WAITING_FOR_CLIENT";
            } else if (activeTab === "Completed") {
                return ["COMPLETED", "FILING_DONE"].includes(c.status);
            } else if (activeTab === "Delayed") {
                return c.status === "DELAYED";
            } else if (activeTab === "Overdue") {
                return c.status === "OVERDUE";
            }
            return true;
        });
    }, [filteredByCommonControls, activeTab]);

    const handleDiscountClick = () => {
        window.location.href = "/subscription-manager";
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            toast.error("Please select at least one compliance to delete");
            return;
        }

        if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected compliance(s)?`)) {
            await deleteCompliances(selectedIds);
            setSelectedIds([]); // Clear selection after delete
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === finalFilteredCompliances.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(finalFilteredCompliances.map((c: any) => c._id || c.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };
    const handleExport = () => toast.info("Exporting records...");

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">Compliances</h1>

                <div className="flex items-center gap-4 flex-1 justify-end">
                    {canManage && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="flex items-center gap-1"><Switch checked={filterInternal} onCheckedChange={setFilterInternal} /> Internal</span>
                            <span className="flex items-center gap-1"><Switch checked={filterMandatory} onCheckedChange={setFilterMandatory} /> Mandatory</span>
                        </div>
                    )}

                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by compliance, expert or reference id"
                            className="pl-9 pr-9 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="h-4 w-4 text-slate-400" />
                            </button>
                        )}
                    </div>

                    {canManage && (
                        <div className="flex items-center gap-2">
                            {isSuperAdmin && (
                                <Button
                                    variant="outline"
                                    className="border-[#002A52] text-[#002A52] hover:bg-[#002A52] hover:text-white"
                                    onClick={() => setIsTemplateOpen(true)}
                                >
                                    Manage Templates
                                </Button>
                            )}
                            <Button
                                className="bg-[#002A52] hover:bg-[#001f3f] text-white"
                                onClick={() => setIsCreateOpen(true)}
                            >
                                Add new compliance
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-2xl">🏷️</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Welcome! Here's your new subscriber offer.</h3>
                        <p className="text-sm text-slate-600">Get 10% off your Annual Compliance Subscription and put your legal duties on autopilot.</p>
                    </div>
                </div>
                <Button variant="outline" className="bg-white border-slate-200 text-slate-800 hover:bg-slate-50 font-medium whitespace-nowrap" onClick={handleDiscountClick}>
                    Claim My 10% Discount
                </Button>
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Compliance Department</label>
                    <div className="relative">
                        <Select value={selectedDept || "NONE"} onValueChange={(val) => handleDeptChange(val === "NONE" ? "" : val)}>
                            <SelectTrigger className={cn("bg-white border-slate-200 min-h-10 pr-9", selectedDept ? "bg-slate-100/50" : "")}>
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NONE" className="text-slate-400 italic">Clear Selection</SelectItem>
                                {departments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {selectedDept && (
                            <button
                                onClick={clearDept}
                                className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors z-20"
                                title="Clear Department"
                            >
                                <X className="h-3 w-3 text-slate-500" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Compliance Category</label>
                    <div className="relative">
                        <Popover onOpenChange={handleCategoryOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn(
                                    "w-full justify-between font-normal bg-white border-slate-200 hover:bg-white h-10 px-3",
                                    selectedCategories.length > 0 ? "bg-slate-100/50 text-slate-900 pr-9" : "text-slate-500"
                                )}>
                                    <span className="truncate">{selectedCategories.length > 0 ? `${selectedCategories.length} Selected` : "Select"}</span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-2" align="start">
                                {selectedDept ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between pb-1 border-b">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Categories</span>
                                            <button className="text-[10px] text-blue-600 hover:underline" onClick={() => { setTempCategories([]); setSelectedCategories([]); }}>Clear All</button>
                                        </div>
                                        <div className="max-h-[200px] overflow-y-auto space-y-2 py-1">
                                            {(categoriesMap[selectedDept] || []).map((cat) => (
                                                <div key={cat} className="flex items-center gap-2 px-1">
                                                    <Checkbox id={cat} checked={tempCategories.includes(cat)} onCheckedChange={() => toggleCategory(cat)} />
                                                    <label htmlFor={cat} className="text-sm font-medium leading-none cursor-pointer select-none">{cat}</label>
                                                </div>
                                            ))}
                                        </div>
                                        <Button className="w-full bg-[#002A52] hover:bg-[#001f3f] h-8 text-xs font-semibold" onClick={applyCategories}>Apply</Button>
                                    </div>
                                ) : <div className="text-sm text-slate-500 py-4 text-center">Select a department first</div>}
                            </PopoverContent>
                        </Popover>
                        {selectedCategories.length > 0 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedCategories([]); setTempCategories([]); }}
                                className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors z-20"
                                title="Clear Categories"
                            >
                                <X className="h-3 w-3 text-slate-500" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Due Date</label>
                    <div className="relative">
                        <Select value={selectedDueDate || "NONE"} onValueChange={(val) => setSelectedDueDate(val === "NONE" ? null : val)}>
                            <SelectTrigger className={cn("bg-white border-slate-200 min-h-10 pr-9", selectedDueDate ? "bg-slate-100/50" : "")}>
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NONE" className="text-slate-400 italic">Clear Selection</SelectItem>
                                {dueDates.map(date => <SelectItem key={date} value={date}>{date}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {selectedDueDate && (
                            <button
                                onClick={clearDueDate}
                                className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors z-20"
                                title="Clear Date"
                            >
                                <X className="h-3 w-3 text-slate-500" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="md:col-span-4 flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-500 hover:text-slate-900 h-8 gap-1.5"
                        onClick={resetAllFilters}
                    >
                        <RefreshCcw className="h-3 w-3" />
                        Reset All Filters
                    </Button>
                </div>
            </div>

            {/* Tabs and Actions */}
            <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-200">
                <div className="flex items-center overflow-x-auto w-full md:w-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={cn(
                                "px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                                activeTab === tab.name ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
                            )}
                        >
                            {tab.name} <span className="text-xs text-slate-400 ml-1">({tab.count})</span>
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 py-2 md:py-0">
                    {canManage && selectedIds.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100 animate-in fade-in slide-in-from-right-2">
                                {selectedIds.length} Selected
                            </span>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={handleBulkDelete} title="Delete Selected">
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>
                    )}
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-500" onClick={handleExport}>
                        <Download className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 flex justify-center items-center"><Skeleton className="w-full h-32" /></div>
                ) : (
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={finalFilteredCompliances.length > 0 && selectedIds.length === finalFilteredCompliances.length}
                                        onCheckedChange={toggleSelectAll}
                                    />
                                </TableHead>
                                <TableHead className="font-semibold text-slate-700">Compliance</TableHead>
                                <TableHead className="font-semibold text-slate-700">Office</TableHead>
                                <TableHead className="font-semibold text-slate-700">Expert name</TableHead>
                                <TableHead className="font-semibold text-slate-700">Due Date</TableHead>
                                <TableHead className="font-semibold text-slate-700">Stage</TableHead>
                                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                <TableHead className="font-semibold text-slate-700">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {finalFilteredCompliances.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-slate-400 py-10">No compliances found for the current filters.</TableCell>
                                </TableRow>
                            ) : finalFilteredCompliances.map((c: any) => (
                                <TableRow key={c._id || c.id} className={cn("hover:bg-slate-50 transition-colors", selectedIds.includes(c._id || c.id) ? "bg-blue-50/50" : "")}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedIds.includes(c._id || c.id)}
                                            onCheckedChange={() => toggleSelect(c._id || c.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-800">{c.serviceType}</span>
                                            {(c.risk === "HIGH" || c.isMandatory) && (
                                                <span className="bg-orange-500 text-white text-[10px] font-bold px-1 rounded-sm">M</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600">{c.company?.name || "N/A"}</TableCell>
                                    <TableCell><span className="text-xs text-slate-800 font-medium">{c.expertName || "Unassigned"}</span></TableCell>
                                    <TableCell className="text-slate-600 font-medium">{new Date(c.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</TableCell>
                                    <TableCell className="text-slate-600">{c.stage ? c.stage.charAt(0) + c.stage.slice(1).toLowerCase() : ""}</TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            "text-[11px] font-semibold px-2 py-0.5 rounded whitespace-nowrap",
                                            ["COMPLETED", "FILING_DONE"].includes(c.status) ? "bg-green-100 text-green-700" :
                                                ["DELAYED", "OVERDUE"].includes(c.status) ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                                        )}>
                                            {formatComplianceStatus(c.status)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 border-[#002A52] text-[#002A52] hover:bg-[#002A52] hover:text-white flex items-center gap-1"
                                            onClick={() => { setSelectedCompliance(c); setIsActionOpen(true); }}
                                        >
                                            <FileCheck2 className="h-4 w-4" />
                                            {canManage ? "Manage" : "Action"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <ComplianceActionDialog compliance={selectedCompliance} isOpen={isActionOpen} onClose={() => { setIsActionOpen(false); setSelectedCompliance(null); }} />
            <CreateComplianceDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
            <CreateTemplateDialog isOpen={isTemplateOpen} onClose={() => setIsTemplateOpen(false)} />

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="bg-purple-600 text-white text-[10px] font-bold px-1 rounded-sm">S</span> Scenario based</span>
                <span className="flex items-center gap-1"><span className="bg-yellow-400 text-black text-[10px] font-bold px-1 rounded-sm">R</span> Recommended</span>
                <span className="flex items-center gap-1"><span className="bg-orange-500 text-white text-[10px] font-bold px-1 rounded-sm">M</span> Mandatory</span>
            </div>
        </div>
    )
}
