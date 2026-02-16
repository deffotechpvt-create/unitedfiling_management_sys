"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, ChevronLeft, Gift, Loader2 } from "lucide-react"
import { reportService, ReportStats, HighRiskCompliance } from "@/services/reportService"
import { toast } from "sonner"
import { useCompany } from "@/context/company-context"

type ViewState = 'DASHBOARD' | 'HIGH_RISK'

export default function ReportsPage() {
    const [view, setView] = useState<ViewState>('DASHBOARD')
    const [stats, setStats] = useState<ReportStats | null>(null)
    const [highRiskItems, setHighRiskItems] = useState<HighRiskCompliance[]>([])
    const [loading, setLoading] = useState(true)
    const { selectedCompany } = useCompany()

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const [statsRes, highRiskRes] = await Promise.all([
                reportService.getOverview(selectedCompany?._id),
                reportService.getHighRiskCompliances(selectedCompany?._id)
            ])
            setStats(statsRes.stats)
            setHighRiskItems(highRiskRes.compliances)
        } catch (error: any) {
            console.error("Error fetching reports:", error)
            toast.error(error.response?.data?.message || "Failed to load report data")
        } finally {
            setLoading(false)
        }
    }, [selectedCompany?._id])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    if (loading && !stats) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    // --- COMPONENTS ---

    const DashboardView = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-slate-900">Reports Overview</h1>

            <div className="grid md:grid-cols-2 gap-8">
                {/* COLUMN 1 */}
                <div className="space-y-8">
                    {/* By Risk */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-medium text-slate-800">By Risk</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {['HIGH', 'MEDIUM', 'LOW'].map((risk) => {
                                    const count = stats?.byRisk.find(r => r._id === risk)?.count || 0
                                    return (
                                        <button
                                            key={risk}
                                            onClick={() => risk === 'HIGH' && setView('HIGH_RISK')}
                                            className={`w-full flex items-center justify-between p-4 transition-colors text-left ${risk === 'HIGH' ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-4 w-4 text-slate-400" />
                                                <span className="text-sm font-medium text-slate-700">{risk.charAt(0) + risk.slice(1).toLowerCase()}</span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">{count}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* By Stage */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-medium text-slate-800">By Stage</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {stats?.byStage.map((stage, idx) => (
                                    <div key={idx} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700">{stage._id}</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">{stage.count}</span>
                                    </div>
                                ))}
                                {(!stats || stats.byStage.length === 0) && <div className="p-4 text-sm text-slate-400">No data available</div>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* COLUMN 2 */}
                <div className="space-y-8">
                    {/* By Organization */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-medium text-slate-800">By Organization</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {stats?.byOrganization.map((org, idx) => (
                                    <div key={idx} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700">{org.name}</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">{org.count}</span>
                                    </div>
                                ))}
                                {(!stats || stats.byOrganization.length === 0) && <div className="p-4 text-sm text-slate-400">No data available</div>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* By Department */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-medium text-slate-800">By Department</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {stats?.byDepartment.map((dept, idx) => (
                                    <div key={idx} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700">{dept._id}</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">{dept.count}</span>
                                    </div>
                                ))}
                                {(!stats || stats.byDepartment.length === 0) && <div className="p-4 text-sm text-slate-400">No data available</div>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )

    const HighRiskDetailView = () => (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setView('DASHBOARD')} className="text-blue-600 pl-0 hover:pl-2 transition-all hover:bg-transparent">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Go back
                </Button>
            </div>

            {/* Banner */}
            <div className="bg-white border border-blue-100 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-orange-100 p-2 rounded-lg">
                        <Gift className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">Welcome! Here's your new subscriber offer.</h3>
                        <p className="text-sm text-slate-500">Get 10% off your Annual Compliance Subscription and put your legal duties on autopilot.</p>
                    </div>
                </div>
                <Button variant="outline" className="whitespace-nowrap border-slate-300 text-slate-700">
                    Claim My 10% Discount
                </Button>
            </div>

            {/* Title Row */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Based on Risk - High <span className="text-slate-500 font-normal text-lg">({highRiskItems.length})</span></h2>
                <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4 text-slate-500" />
                </Button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-medium">Compliance</th>
                                <th className="px-6 py-4 font-medium">Office</th>
                                <th className="px-6 py-4 font-medium">Expert name</th>
                                <th className="px-6 py-4 font-medium">Due Date</th>
                                <th className="px-6 py-4 font-medium">Stage</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {highRiskItems.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-700">{item.serviceType || 'General Compliance'}</span>
                                            {item.isNew && (
                                                <span className="bg-orange-500 text-white text-[10px] font-bold px-1 rounded flex items-center justify-center w-4 h-4">M</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{item.company?.name || 'Unknown'}</td>
                                    <td className="px-6 py-4 text-slate-500">{item.expertName || '-'}</td>
                                    <td className="px-6 py-4 text-slate-500">{new Date(item.dueDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-slate-500">{item.stage}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-md text-xs font-medium border ${item.status === 'DELAYED' ? 'bg-pink-100 text-pink-700 border-pink-200' :
                                            item.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' :
                                                'bg-blue-100 text-blue-700 border-blue-200'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {highRiskItems.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                        No high risk compliances found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )

    return (
        <div className="p-6 pb-20 max-w-7xl mx-auto">
            {view === 'DASHBOARD' ? <DashboardView /> : <HighRiskDetailView />}
        </div>
    )
}
