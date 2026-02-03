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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ShieldAlert, UserCheck, UserMinus, Plus } from "lucide-react"

export default function AdminManagementPage() {
    const { user } = useAuth()
    const { admins, updateAdminStatus } = useSuperAdmin()

    // Handlers
    const handleRevokeAccess = (adminId: string) => {
        updateAdminStatus(adminId)
    }

    return (
        <div className="space-y-8 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Management</h1>
                    <p className="text-slate-500">Manage admin access and view their current load.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add New Admin
                </Button>
            </div>

            {/* Admin Management Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-blue-600" />
                        Admin List
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Clients Assigned</TableHead>
                                <TableHead>Capacity</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {admins.map((admin) => (
                                <TableRow key={admin.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{admin.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{admin.name}</span>
                                                <span className="text-xs text-slate-500">{admin.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={admin.status === "ACTIVE" ? "default" : "destructive"}>
                                            {admin.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{admin.clientsAssigned}</TableCell>
                                    <TableCell>
                                        <div className="w-full bg-slate-200 rounded-full h-2.5 max-w-[100px]">
                                            <div
                                                className="bg-blue-600 h-2.5 rounded-full"
                                                style={{ width: `${(admin.clientsAssigned / admin.maxClients) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs text-slate-500 mt-1 inline-block">
                                            {admin.clientsAssigned} / {admin.maxClients}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={admin.status === "ACTIVE" ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                                            onClick={() => handleRevokeAccess(admin.id)}
                                        >
                                            {admin.status === "ACTIVE" ? (
                                                <><UserMinus className="mr-2 h-4 w-4" /> Revoke Access</>
                                            ) : (
                                                <><UserCheck className="mr-2 h-4 w-4" /> Grant Access</>
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
