"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, TrendingUp, ChevronLeft, Building2, User, Share, Share2, CornerUpRight, Gift, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type ViewState = 'DASHBOARD' | 'HIGH_RISK'

export default function ReportsPage() {
    const [view, setView] = useState<ViewState>('DASHBOARD')

    // --- MOCK DATA ---
    const highRiskItems = [
        {
            compliance: "Employee State Insurance (ESI) Filings - August",
            isNew: true,
            office: "aachi - Arunachal Pradesh",
            expert: "-",
            dueDate: "15 Sep 2025",
            stage: "Payment",
            status: "Delayed"
        },
        {
            compliance: "Preparation and Finalization of Board Meeting Minutes - July",
            isNew: true,
            office: "aachi - Arunachal Pradesh",
            expert: "-",
            dueDate: "30 Sep 2025",
            stage: "Payment",
            status: "Delayed"
        },
        {
            compliance: "Payroll Processing & Salary Disbursement - September",
            isNew: true,
            office: "aachi - Arunachal Pradesh",
            expert: "-",
            dueDate: "30 Sep 2025",
            stage: "Payment",
            status: "Delayed"
        },
        {
            compliance: "24Q TDS Challan Payment - September",
            isNew: true,
            office: "aachi - Arunachal Pradesh",
            expert: "-",
            dueDate: "07 Oct 2025",
            stage: "Payment",
            status: "Delayed"
        },
        {
            compliance: "Employee State Insurance (ESI) Filings - September",
            isNew: true,
            office: "aachi - Arunachal Pradesh",
            expert: "-",
            dueDate: "15 Oct 2025",
            stage: "Payment",
            status: "Delayed"
        },
        {
            compliance: "Payroll Processing & Salary Disbursement - October",
            isNew: true,
            office: "aachi - Arunachal Pradesh",
            expert: "-",
            dueDate: "31 Oct 2025",
            stage: "Payment",
            status: "Delayed"
        },
        {
            compliance: "TDS Return Filing (Quarter 2) - October",
            isNew: true,
            office: "aachi - Arunachal Pradesh",
            expert: "-",
            dueDate: "31 Oct 2025",
            stage: "Payment",
            status: "Delayed"
        }
    ]

    // --- COMPONENTS ---

    const DashboardView = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-slate-900">Reports</h1>

            <div className="grid md:grid-cols-2 gap-8">
                {/* COLUMN 1 */}
                <div className="space-y-8">
                    {/* By Risk */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-medium text-slate-800">By Risk</h3>
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <button
                                onClick={() => setView('HIGH_RISK')}
                                className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 text-left"
                            >
                                <FileText className="h-4 w-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-700">High</span>
                            </button>
                            <div className="w-full flex items-center gap-3 p-4 border-b border-slate-100">
                                <FileText className="h-4 w-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-700">Medium</span>
                            </div>
                            <div className="w-full flex items-center gap-3 p-4">
                                <FileText className="h-4 w-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-700">Low</span>
                            </div>
                        </div>
                    </div>

                    {/* By Stage */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-medium text-slate-800">By Stage</h3>
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            {[
                                "Payment",
                                "Upload Documents",
                                "Verifying Documents & Preparation",
                                "Government Submission",
                                "Filing Done"
                            ].map((stage, idx) => (
                                <div key={idx} className="w-full flex items-center gap-3 p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer">
                                    <FileText className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-700">{stage}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* COLUMN 2 */}
                <div className="space-y-8">
                    {/* By Organization */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-medium text-slate-800">By Organization</h3>
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <div className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                                <FileText className="h-4 w-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-700">aachi - Arunachal Pradesh</span>
                            </div>
                        </div>
                    </div>

                    {/* By Department */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-medium text-slate-800">By Department</h3>
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            {[
                                "HR / Labour Compliance",
                                "Direct Tax",
                                "Corporate Secretarial",
                                "Accounts Department"
                            ].map((dept, idx) => (
                                <div key={idx} className="w-full flex items-center gap-3 p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer">
                                    <FileText className="h-4 w-4 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-700">{dept}</span>
                                </div>
                            ))}
                        </div>
                    </div>
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
                <h2 className="text-xl font-bold text-slate-900">Based on Risk - High <span className="text-slate-500 font-normal text-lg">(21)</span></h2>
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
                                            <span className="font-medium text-slate-700">{item.compliance}</span>
                                            {item.isNew && (
                                                <span className="bg-orange-500 text-white text-[10px] font-bold px-1 rounded flex items-center justify-center w-4 h-4">M</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{item.office}</td>
                                    <td className="px-6 py-4 text-slate-500">{item.expert}</td>
                                    <td className="px-6 py-4 text-slate-500">{item.dueDate}</td>
                                    <td className="px-6 py-4 text-slate-500">{item.stage}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-md text-xs font-medium border border-pink-200">
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
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
