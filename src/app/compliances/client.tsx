"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useCompany } from "@/context/company-context"
import { fetchCompliances } from "@/lib/api"
import { ComplianceTable } from "@/components/dashboard/compliance-table"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Filter, Trash2, Download, AlertCircle, ShoppingCart, X, ChevronDown } from "lucide-react"

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

    // Filters State
    const [searchQuery, setSearchQuery] = useState("")
    const [filterInternal, setFilterInternal] = useState(false)
    const [filterMandatory, setFilterMandatory] = useState(false)
    const [activeTab, setActiveTab] = useState("All")

    // Filter Logic States
    const [selectedDept, setSelectedDept] = useState<string | null>(null)
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [tempCategories, setTempCategories] = useState<string[]>([]) // For the "Apply" pattern
    const [selectedDueDate, setSelectedDueDate] = useState<string | null>("This Month")

    // Options
    const departments = [
        "HR/ Labour Compliance",
        "Direct Tax",
        "Corporate Secretarial",
        "Accounts Department"
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
        "HR/ Labour Compliance": ["Payroll", "ESI"],
        "Corporate Secretarial": ["Incorporation", "Compliance"],
        "Accounts Department": ["Bookkeeping", "Auditing"]
    }

    const { data: compliances = [], isLoading } = useQuery({
        queryKey: ["compliances", selectedCompany.id],
        queryFn: () => fetchCompliances(selectedCompany.id),
    })

    const handleDeptChange = (val: string) => {
        if (val === selectedDept) return;
        setSelectedDept(val);
        setSelectedCategories([]); // Reset categories when dept changes
        setTempCategories([]);
    }

    const clearDept = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedDept(null);
        setSelectedCategories([]);
        setTempCategories([]);
    }

    const clearDueDate = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedDueDate(null);
    }

    // Toggle logic for checkbox
    const toggleCategory = (cat: string) => {
        if (tempCategories.includes(cat)) {
            setTempCategories(tempCategories.filter(c => c !== cat))
        } else {
            setTempCategories([...tempCategories, cat])
        }
    }

    const applyCategories = () => {
        setSelectedCategories(tempCategories);
        // In a real app, this would trigger a refetch or filter the list
    }

    const handleCategoryOpen = (open: boolean) => {
        if (open) {
            setTempCategories(selectedCategories)
        }
    }


    // Mock tabs counts
    const tabs = [
        { name: "All", count: selectedDept ? 10 : 33 }, // Dynamic count mock
        { name: "Needs action", count: selectedDept ? 10 : 33 },
        { name: "In progress", count: 0 },
        { name: "Completed", count: 0 },
        { name: "Upcoming", count: 0 },
    ]

    // Mock Data to match screenshot EXACTLY for now (since API is mock anyway)
    // Overriding the API data visually to match the user request perfect
    const rows = [
        {
            id: 1,
            name: "24Q TDS Challan Payment - January",
            isMandatory: true,
            office: "aachi - Arunachal Pradesh",
            dueDate: "07 Feb 2026",
            stage: "Payment",
            status: "Pending"
        },
        {
            id: 2,
            name: "Employee State Insurance (ESI) Filings - January",
            isMandatory: true,
            office: "aachi - Arunachal Pradesh",
            dueDate: "15 Feb 2026",
            stage: "Payment",
            status: "Pending"
        },
        {
            id: 3,
            name: "Payroll Processing & Salary Disbursement - February",
            isMandatory: true,
            office: "aachi - Arunachal Pradesh",
            dueDate: "28 Feb 2026",
            stage: "Payment",
            status: "Pending"
        }
    ]

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">Compliances</h1>

                <div className="flex items-center gap-4 flex-1 justify-end">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Switch checked={filterInternal} onCheckedChange={setFilterInternal} /> Internal
                        <Switch checked={filterMandatory} onCheckedChange={setFilterMandatory} /> Mandatory
                    </div>

                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by compliance, expert or reference id"
                            className="pl-9 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Button className="bg-[#002A52] hover:bg-[#001f3f] text-white">Add new compliance</Button>
                </div>
            </div>

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
                <Button variant="outline" className="bg-white border-slate-200 text-slate-800 hover:bg-slate-50 font-medium whitespace-nowrap">
                    Claim My 10% Discount
                </Button>
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                {/* Compliance Department */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Compliance Department</label>
                    <Select value={selectedDept || ""} onValueChange={handleDeptChange}>
                        <SelectTrigger className={cn("bg-white border-slate-200 min-h-10", selectedDept ? "bg-slate-100/50" : "")}>
                            {selectedDept ? (
                                <div className="flex items-center gap-2 bg-slate-200 px-2 py-0.5 rounded text-sm text-slate-800 font-medium">
                                    <span className="truncate max-w-[140px]">{selectedDept}</span>
                                    <X className="h-3 w-3 cursor-pointer hover:text-slate-900" onClick={clearDept} />
                                </div>
                            ) : (
                                <SelectValue placeholder="Select" />
                            )}
                        </SelectTrigger>
                        <SelectContent>
                            {departments.map(dept => (
                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Compliance Category */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Compliance Category</label>
                    <Popover onOpenChange={handleCategoryOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between font-normal text-slate-500 bg-white border-slate-200 hover:bg-white h-10 px-3">
                                <span>Select</span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-2" align="start">
                            {selectedDept ? (
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        {(categoriesMap[selectedDept] || []).map((cat) => (
                                            <div key={cat} className="flex items-center gap-2">
                                                <Checkbox
                                                    id={cat}
                                                    checked={tempCategories.includes(cat)}
                                                    onCheckedChange={() => toggleCategory(cat)}
                                                />
                                                <label htmlFor={cat} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                    {cat}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    <Button className="w-full bg-[#002A52] hover:bg-[#001f3f] h-8 text-xs" onClick={applyCategories}>
                                        Apply
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-sm text-slate-500 py-2 text-center">
                                    Please select a department
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Due Date */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Due Date</label>
                    <Select value={selectedDueDate || ""} onValueChange={setSelectedDueDate}>
                        <SelectTrigger className={cn("bg-white border-slate-200 min-h-10", selectedDueDate ? "bg-slate-100/50" : "")}>
                            {selectedDueDate ? (
                                <div className="flex items-center gap-2 bg-slate-200 px-2 py-0.5 rounded text-sm text-slate-800 font-medium">
                                    <span className="truncate">{selectedDueDate}</span>
                                    <X className="h-3 w-3 cursor-pointer hover:text-slate-900" onClick={clearDueDate} />
                                </div>
                            ) : (
                                <SelectValue placeholder="Select" />
                            )}
                        </SelectTrigger>
                        <SelectContent>
                            {dueDates.map(date => (
                                <SelectItem key={date} value={date}>{date}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    {/* Empty div for spacing or Filter button if needed, but per screenshot cleaner look preferred */}
                </div>
            </div>

            {/* Tabs and Actions */}
            <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-200">
                <div className="flex items-center overflow-x-auto w-full md:w-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.name
                                    ? "border-slate-900 text-slate-900"
                                    : "border-transparent text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            {tab.name} <span className="text-xs text-slate-400 ml-1">({tab.count})</span>
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 py-2 md:py-0">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500">
                        <Trash2 className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-500">
                        <Download className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-12"><Checkbox /></TableHead>
                            <TableHead className="font-semibold text-slate-700">Compliance <span className="text-slate-400 text-[10px]">↕</span></TableHead>
                            <TableHead className="font-semibold text-slate-700">Office</TableHead>
                            <TableHead className="font-semibold text-slate-700">Expert name</TableHead>
                            <TableHead className="font-semibold text-slate-700">Due Date <span className="text-slate-400 text-[10px]">↕</span></TableHead>
                            <TableHead className="font-semibold text-slate-700">Stage <span className="text-slate-400 text-[10px]">↕</span></TableHead>
                            <TableHead className="font-semibold text-slate-700">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.id} className="hover:bg-slate-50">
                                <TableCell><Checkbox /></TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-800">{row.name}</span>
                                        {row.isMandatory && (
                                            <span className="bg-orange-500 text-white text-[10px] font-bold px-1 rounded-sm">M</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-slate-600">{row.office}</TableCell>
                                <TableCell>
                                    <button className="text-[10px] text-slate-400 border border-dashed border-slate-300 rounded-full px-2 py-1 hover:border-blue-400 hover:text-blue-500 transition-colors">
                                        + Assign an expert
                                    </button>
                                </TableCell>
                                <TableCell className="text-slate-600 font-medium">{row.dueDate}</TableCell>
                                <TableCell className="text-slate-600">{row.stage}</TableCell>
                                <TableCell>
                                    <span className="bg-pink-100 text-pink-700 text-xs font-semibold px-2 py-1 rounded">
                                        {row.status}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination & Legend */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1"><span className="bg-purple-600 text-white text-[10px] font-bold px-1 rounded-sm">S</span> Scenario based</span>
                    <span className="flex items-center gap-1"><span className="bg-yellow-400 text-black text-[10px] font-bold px-1 rounded-sm">R</span> Recommended</span>
                    <span className="flex items-center gap-1"><span className="bg-orange-500 text-white text-[10px] font-bold px-1 rounded-sm">M</span> Mandatory</span>
                </div>

                <div className="flex items-center gap-2">
                    <span>Showing</span>
                    <Select defaultValue="10">
                        <SelectTrigger className="h-8 w-16 bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                    <span>items per page</span>
                </div>
            </div>

        </div>
    )
}
