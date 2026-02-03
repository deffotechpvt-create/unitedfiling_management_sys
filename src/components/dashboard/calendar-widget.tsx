"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function CalendarWidget() {
    const [month, setMonth] = React.useState("february")
    const [year, setYear] = React.useState("2026")

    // Mock Data based on the user's image
    const events = [
        {
            id: 1,
            date: "07 Feb 2026",
            title: "Payment of Tax Deducted at Source (TDS) for the previous month to the government through challan...",
            bg: "bg-red-50",
            textColor: "text-red-500"
        },
        {
            id: 2,
            date: "15 Feb 2026",
            title: "Filing of monthly contributions under the Employee State Insurance (ESI) scheme. Includes details of...",
            bg: "bg-red-50",
            textColor: "text-red-500"
        },
        {
            id: 3,
            date: "28 Feb 2026",
            title: "Ensuring accurate payroll processing, salary disbursement, and generation of payslips",
            bg: "bg-red-50",
            textColor: "text-red-500"
        }
    ]

    return (
        <Card className="h-full border-none shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold text-slate-800">Compliance Calendar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Selectors */}
                <div className="flex gap-4">
                    <div className="flex-1 space-y-1">
                        <label className="text-xs text-slate-500">Month</label>
                        <Select value={month} onValueChange={setMonth}>
                            <SelectTrigger className="w-full bg-slate-50 border-slate-200">
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="january">January</SelectItem>
                                <SelectItem value="february">February</SelectItem>
                                <SelectItem value="march">March</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 space-y-1">
                        <label className="text-xs text-slate-500">Year</label>
                        <Select value={year} onValueChange={setYear}>
                            <SelectTrigger className="w-full bg-slate-50 border-slate-200">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2025">2025</SelectItem>
                                <SelectItem value="2026">2026</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Event List */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-slate-700">
                        {month.charAt(0).toUpperCase() + month.slice(1)} {year} <span className="text-slate-500">({events.length})</span>
                    </h4>

                    <div className="space-y-3 relative">
                        {/* Vertical Line */}
                        <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-slate-800 rounded-full"></div>

                        {events.map((event) => (
                            <div key={event.id} className={`ml-4 p-3 rounded-lg ${event.bg} border border-red-100`}>
                                <div className={`text-xs font-semibold ${event.textColor} mb-1`}>
                                    Due date: {event.date}
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                    {event.title}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
