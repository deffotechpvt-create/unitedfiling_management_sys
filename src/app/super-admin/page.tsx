"use client"

import { useAuth } from "@/context/auth-context"
import { useSuperAdmin } from "@/context/super-admin-context"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ShieldAlert, UserCheck, UserMinus, Plus } from "lucide-react"

export default function SuperAdminDashboard() {
    const { admins, clients } = useSuperAdmin()

    // Calculate Global Stats
    const totalAdmins = admins.length
    const activeAdmins = admins.filter(a => a.status === "ACTIVE").length
    const totalClients = clients.length
    const activeClients = clients.filter(c => c.status === "ACTIVE").length
    const totalPendingWork = clients.reduce((acc, curr) => acc + curr.pendingWork, 0)

    const stats = [
        { title: "Total Clients", value: totalClients, icon: UserCheck, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Active Admins", value: activeAdmins, subValue: `of ${totalAdmins} Total`, icon: ShieldAlert, color: "text-green-600", bg: "bg-green-50" },
        { title: "Pending Actions Global", value: totalPendingWork, icon: ShieldAlert, color: "text-orange-600", bg: "bg-orange-50" },
    ]

    return (
        <div className="space-y-8 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Global Dashboard</h1>
                    <p className="text-slate-500">Overview of platform performance and resource allocation.</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i}>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                                <div className="flex items-end gap-2 mt-1">
                                    <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                                    {stat.subValue && <span className="text-xs text-slate-400 mb-1">{stat.subValue}</span>}
                                </div>
                            </div>
                            <div className={`p-3 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Activity / Simplified View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Platform Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <span className="text-sm font-medium">Server Uptime</span>
                                <span className="text-sm text-green-600 font-bold">99.9%</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <span className="text-sm font-medium">New Clients (This Month)</span>
                                <span className="text-sm text-slate-900 font-bold">12</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <span className="text-sm font-medium">Admin Utilization</span>
                                <span className="text-sm text-blue-600 font-bold">68%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Admin Capacity Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {admins.slice(0, 5).map(admin => (
                                <div key={admin.id} className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span>{admin.name}</span>
                                        <span className={admin.clientsAssigned >= admin.maxClients ? "text-red-500" : "text-slate-500"}>
                                            {admin.clientsAssigned}/{admin.maxClients}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                                        <div
                                            className={`h-1.5 rounded-full ${admin.clientsAssigned >= admin.maxClients ? 'bg-red-500' : 'bg-blue-500'}`}
                                            style={{ width: `${(admin.clientsAssigned / admin.maxClients) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
