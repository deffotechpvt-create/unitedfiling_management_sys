"use client";

import { useMemo, useState } from "react";
import { useSuperAdmin } from "@/context/super-admin-context";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Users,
    Search,
    Trash2,
    UserCheck,
    UserMinus,
    RefreshCw,
} from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { ROLES } from "@/lib/roles";

export function ManageUsersTab() {
    const {
        allUsers,        // SimpleUser[]
        loading,
        refreshAllUsers,
        updateUserStatus,
        deleteUser,
    } = useSuperAdmin();

    const [searchQuery, setSearchQuery] = useState("");
    const filteredUsers = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return allUsers;

        return allUsers.filter((u) =>
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
        );
    }, [allUsers, searchQuery]);

    const handleToggleStatus = async (userId: string) => {
        try {
            await updateUserStatus(userId);
        } catch {
            // handled in context
        }
    };

    const handleDelete = async (userId: string, name: string) => {
        if (
            confirm(
                `Are you sure you want to delete user ${name}? This action cannot be undone.`
            )
        ) {
            try {
                await deleteUser(userId);
            } catch {
                // handled in context
            }
        }
    };

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                        <Users className="h-5 w-5 text-blue-600" />
                        Platform Users ({filteredUsers ? filteredUsers.length : 0})
                    </CardTitle>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refreshAllUsers()}
                            disabled={loading}
                            className="h-10"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                            />
                        </Button>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by name or email..."
                                className="pl-9 h-10 w-full md:w-[250px] bg-white border-slate-200 shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
                <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-semibold text-slate-900">
                                    User Information
                                </TableHead>
                                <TableHead className="font-semibold text-slate-900">
                                    Status
                                </TableHead>
                                <TableHead className="font-semibold text-slate-900">
                                    Joined Date
                                </TableHead>
                                <TableHead className="text-right font-semibold text-slate-900">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-10">
                                        <div className="flex flex-col items-center gap-2">
                                            <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
                                            <p className="text-sm text-slate-500">
                                                Loading users...
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-center py-10 text-slate-500 italic"
                                    >
                                        No users found matching your criteria
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow
                                        key={user._id}
                                        className="hover:bg-slate-50/50 transition-colors"
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border border-slate-200 shadow-sm">
                                                    <AvatarFallback className="bg-slate-50 text-slate-700 font-bold">
                                                        {user.name.slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">
                                                        {user.name}
                                                    </span>
                                                    <span className="text-xs text-slate-500 font-medium">
                                                        {user.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    user.status === "ACTIVE" ? "default" : "destructive"
                                                }
                                                className={`rounded-full px-2.5 py-0.5 font-semibold text-[10px] tracking-wide ${user.status === "ACTIVE"
                                                    ? "bg-green-100 text-green-700 hover:bg-green-200 border-none"
                                                    : "bg-red-100 text-red-700 hover:bg-red-200 border-none"
                                                    }`}
                                            >
                                                {user.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                            {new Date(user.createdAt).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <RoleGuard allowedRoles={[ROLES.SUPER_ADMIN]}>
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={`h-9 px-3 font-semibold text-xs rounded-lg transition-all ${user.status === "ACTIVE"
                                                            ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            : "text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            }`}
                                                        onClick={() =>
                                                            handleToggleStatus(user._id)
                                                        }
                                                    >
                                                        {user.status === "ACTIVE" ? (
                                                            <>
                                                                <UserMinus className="mr-1.5 h-3.5 w-3.5" /> Revoke Access
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Grant Access
                                                            </>
                                                        )}
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 w-9 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        onClick={() => handleDelete(user._id, user.name)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </RoleGuard>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
