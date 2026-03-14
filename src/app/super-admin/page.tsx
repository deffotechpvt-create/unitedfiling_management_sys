"use client";

import { useSuperAdmin } from "@/context/super-admin-context";
import { useConsultation } from "@/context/consultation-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ShieldAlert,
    UserCheck,
    Users,
    Activity,
    TrendingUp,
    AlertCircle,
    Clock,
    CreditCard
} from "lucide-react";

export default function SuperAdminDashboard() {
    const { admins = [], clients = [], serverStats } = useSuperAdmin();
    const { consultations = [] } = useConsultation();

    // Calculate Global Stats
    const totalAdmins = admins.length;
    const activeAdmins = admins.filter((a: any) => a.status === "ACTIVE").length;
    const totalClients = clients.length;
    const totalPendingWork = clients.reduce((acc: number, curr: any) => acc + (curr.pendingWork || 0), 0);

    // Calculate Revenue
    const totalRevenue = consultations
        .filter((c: any) => c.payment?.status === 'PAID')
        .reduce((acc: number, c: any) => acc + (c.payment?.amount || 0), 0);

    // Calculate Platform Health
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const newClientsThisMonth = clients.filter((c: any) => {
        const joinedDate = new Date(c.joinedDate || 0);
        return joinedDate >= firstDayOfMonth;
    }).length;

    const consultationsThisMonth = consultations.filter((c: any) => {
        if (c.payment?.status !== 'PAID' || !c.payment?.paidAt) return false;
        const paidDate = new Date(c.payment.paidAt);
        return paidDate >= firstDayOfMonth;
    }).length;

    const avgAdminUtilization = admins.length > 0
        ? Math.round(admins.reduce((acc: number, curr: any) => acc + (curr.utilizationPercentage || 0), 0) / admins.length)
        : 0;

    const stats = [
        {
            title: "Total Clients",
            value: totalClients,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50",
            trend: `+${newClientsThisMonth} this month`
        },
        {
            title: "Active Admins",
            value: activeAdmins,
            subValue: `of ${totalAdmins} Total`,
            icon: ShieldAlert,
            color: "text-green-600",
            bg: "bg-green-50"
        },
        {
            title: "Pending Actions",
            value: totalPendingWork,
            icon: AlertCircle,
            color: "text-orange-600",
            bg: "bg-orange-50",
            trend: totalPendingWork > 50 ? "High workload" : "Normal"
        },
        {
            title: "Consultation Revenue",
            value: `₹${totalRevenue.toLocaleString('en-IN')}`,
            icon: CreditCard,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            trend: `${consultationsThisMonth} consultations this month`
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Global Dashboard</h1>
                    <p className="text-slate-500 mt-1">Platform performance and resource allocation overview</p>
                </div>
                {serverStats && (
                    <Badge variant="outline" className="gap-2 px-3 py-1.5">
                        <Activity className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-xs font-medium">Server Online: {serverStats.uptimeFormatted}</span>
                    </Badge>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
                                        {stat.subValue && (
                                            <span className="text-xs text-slate-400">{stat.subValue}</span>
                                        )}
                                    </div>
                                    {stat.trend && (
                                        <p className="text-xs text-slate-500 flex items-center gap-1">
                                            <TrendingUp className="h-3 w-3" />
                                            {stat.trend}
                                        </p>
                                    )}
                                </div>
                                <div className={`p-4 rounded-xl ${stat.bg}`}>
                                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Platform Health & Admin Capacity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-600" />
                            Platform Health
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="space-y-4">
                            {/* Server Uptime */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium text-slate-700">Server Uptime</span>
                                </div>
                                {serverStats ? (
                                    <div className="text-right">
                                        <span className="text-sm text-green-600 font-bold block">
                                            {serverStats.uptimePercentage}%
                                        </span>
                                        <span className="text-xs text-slate-500">{serverStats.uptimeFormatted}</span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-slate-400">Loading...</span>
                                )}
                            </div>

                            {/* New Clients This Month */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <UserCheck className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium text-slate-700">New Clients (This Month)</span>
                                </div>
                                <span className="text-sm text-slate-900 font-bold">{newClientsThisMonth}</span>
                            </div>

                            {/* Admin Utilization */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <ShieldAlert className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-medium text-slate-700">Avg Admin Utilization</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-20 bg-slate-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${avgAdminUtilization > 80 ? "bg-red-500" : "bg-blue-500"
                                                }`}
                                            style={{ width: `${avgAdminUtilization}%` }}
                                        />
                                    </div>
                                    <span
                                        className={`text-sm font-bold ${avgAdminUtilization > 80 ? "text-red-600" : "text-blue-600"
                                            }`}
                                    >
                                        {avgAdminUtilization}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Admin Capacity Overview */}
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-purple-600" />
                            Admin Capacity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="space-y-4">
                            {admins.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-8">No admins available</p>
                            ) : (
                                admins.slice(0, 5).map((admin: any) => {
                                    const utilization = (admin.clientsAssigned / admin.maxClients) * 100;
                                    const isAtCapacity = admin.clientsAssigned >= admin.maxClients;

                                    return (
                                        <div key={admin.id} className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-slate-700">{admin.name}</span>
                                                <span
                                                    className={`text-xs font-semibold ${isAtCapacity ? "text-red-600" : "text-slate-600"
                                                        }`}
                                                >
                                                    {admin.clientsAssigned}/{admin.maxClients}
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${isAtCapacity ? "bg-red-500" : "bg-blue-500"
                                                        }`}
                                                    style={{ width: `${utilization}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
