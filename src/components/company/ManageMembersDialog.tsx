"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Shield, Trash2, Search, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useCompany } from "@/context/company-context";
import { useAuth } from "@/context/auth-context";
import { Company, User } from "@/types";
import { ROLES, canDelete } from "@/lib/roles";
import companyService from "@/services/companyService";

interface ManageMembersDialogProps {
    isOpen: boolean;
    onClose: () => void;
    company: Company;
    onUpdate: () => void;
}

export function ManageMembersDialog({
    isOpen,
    onClose,
    company,
    onUpdate,
}: ManageMembersDialogProps) {
    const { 
        getAddableUsers, 
        addMember, 
        removeMember, 
        updateMemberRole 
    } = useCompany();
    const { user } = useAuth();
    
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUserId, setSelectedUserId] = useState("");
    const [selectedRole, setSelectedRole] = useState<"OWNER" | "EDITOR" | "VIEWER">("VIEWER");
    const [loading, setLoading] = useState(false);
    const [fetchingUsers, setFetchingUsers] = useState(false);
    const [fetchingFullDetails, setFetchingFullDetails] = useState(false);
    const [currentCompany, setCurrentCompany] = useState<Company>(company);

    const canManageMembers = user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN;

    // Load full details for members
    useEffect(() => {
        if (isOpen && company._id) {
            fetchFullDetails();
        }
    }, [isOpen, company._id]);

    const fetchFullDetails = async () => {
        setFetchingFullDetails(true);
        try {
            const { company: fullCompany } = await companyService.getCompanyById(company._id);
            setCurrentCompany(fullCompany);
        } catch (error) {
            console.error("Failed to load full company details", error);
            toast.error("Failed to load members list");
        } finally {
            setFetchingFullDetails(false);
        }
    };

    // Load all users to allow adding (Only for Management)
    useEffect(() => {
        if (isOpen && canManageMembers) {
            fetchUsers();
        }
    }, [isOpen, canManageMembers, company._id]);

    const fetchUsers = async () => {
        if (!canManageMembers) return; // Safeguard to prevent unauthorized API calls
        
        setFetchingUsers(true);
        try {
            const users = await getAddableUsers(company._id);
            if (Array.isArray(users)) {
                setAllUsers(users);
            }
        } catch (error: any) {
            console.error("Failed to load users", error);
        } finally {
            setFetchingUsers(false);
        }
    };

    const handleAddMember = async () => {
        if (!selectedUserId) {
            toast.error("Please select a user");
            return;
        }

        setLoading(true);
        try {
            const success = await addMember(company._id, selectedUserId, selectedRole);
            if (success) {
                toast.success("Member added successfully");
                setSelectedUserId("");
                fetchFullDetails(); // Refresh local list
                onUpdate(); // Refresh parent list (for memberCount)
                // Optionally refresh users list if they are removed from addable list
                fetchUsers();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to add member");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return;

        setLoading(true);
        try {
            const success = await removeMember(company._id, userId);
            if (success) {
                toast.success("Member removed successfully");
                fetchFullDetails();
                onUpdate();
                fetchUsers();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to remove member");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (userId: string, role: "OWNER" | "EDITOR" | "VIEWER") => {
        setLoading(true);
        try {
            const success = await updateMemberRole(company._id, userId, role);
            if (success) {
                toast.success("Role updated successfully");
                fetchFullDetails();
                onUpdate();
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update role");
        } finally {
            setLoading(false);
        }
    };

    // Filter users that are not already members
    const availableUsers = allUsers.filter(
        (u) => !currentCompany.members?.some((m) => (typeof m.user === 'string' ? m.user === u._id : m.user._id === u._id))
    ).filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        Manage Members: {currentCompany.name}
                    </DialogTitle>
                    <DialogDescription>
                        Control who has access to this company and their permission levels.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-8 mt-6">
                    {/* Add Member Bar - Only for ADMIN/SUPER_ADMIN */}
                    {canManageMembers && (
                        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                <div className="md:col-span-6 space-y-2">
                                    <Label htmlFor="user-select" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                                        Pick a User
                                    </Label>
                                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                        <SelectTrigger id="user-select" className="bg-white h-11 border-slate-200 focus:ring-blue-500 rounded-lg">
                                            <SelectValue placeholder={fetchingUsers ? "Loading..." : "Search and select user..."} />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            <div className="p-2 sticky top-0 bg-white shadow-sm mb-1 z-10 border-b">
                                                <div className="relative">
                                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                                    <Input
                                                        placeholder="Search users..."
                                                        className="pl-9 h-9 text-sm border-slate-100 bg-slate-50/50 focus:bg-white"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            {availableUsers.length === 0 ? (
                                                <div className="p-8 text-center text-sm text-slate-500 italic">No available users found</div>
                                            ) : (
                                                availableUsers.map((u) => (
                                                    <SelectItem key={u._id} value={u._id} className="cursor-pointer py-3 focus:bg-blue-50">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-semibold text-sm text-slate-900">{u.name}</span>
                                                            <span className="text-[10px] text-slate-500 leading-tight">{u.email}</span>
                                                            <Badge variant="outline" className="w-fit text-[8px] h-4 mt-1 bg-slate-50 text-slate-500 border-slate-100">User</Badge>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <Label htmlFor="role-select" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                                        Access Level
                                    </Label>
                                    <Select value={selectedRole} onValueChange={(val: any) => setSelectedRole(val)}>
                                        <SelectTrigger id="role-select" className="bg-white h-11 border-slate-200 focus:ring-blue-500 rounded-lg">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="OWNER" className="font-medium">Owner</SelectItem>
                                            <SelectItem value="EDITOR" className="font-medium">Editor</SelectItem>
                                            <SelectItem value="VIEWER" className="font-medium">Viewer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="md:col-span-3">
                                    <Button
                                        onClick={handleAddMember}
                                        disabled={loading || !selectedUserId}
                                        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 transition-all font-semibold rounded-lg flex items-center justify-center gap-2 group"
                                    >
                                        <UserPlus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                        <span>Add Member</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Members Table */}
                    <div className="border rounded-md overflow-hidden bg-white">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    {canManageMembers && <TableHead className="text-right">Action</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fetchingFullDetails ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-10">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                                                <span className="text-sm text-slate-500 font-medium">Loading members...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : !currentCompany.members || currentCompany.members.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-6 text-slate-500">
                                            No members assigned to this company.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentCompany.members.map((member: any) => {
                                        const user = member.user;
                                        const userId = typeof user === 'string' ? user : user._id;
                                        const userName = typeof user === 'string' ? 'Unknown' : user.name;
                                        const userEmail = typeof user === 'string' ? member.email || '' : user.email;

                                        return (
                                            <TableRow key={member._id || userId}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="bg-slate-100 text-slate-600 text-xs text-bold">
                                                                {userName.slice(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium">{userName}</span>
                                                            <span className="text-xs text-slate-500">{userEmail}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {canManageMembers ? (
                                                        <Select
                                                            value={member.role}
                                                            onValueChange={(val: any) => handleUpdateRole(userId, val)}
                                                            disabled={loading}
                                                        >
                                                            <SelectTrigger
                                                                className={`h-8 w-[100px] text-xs font-semibold ${member.role === 'OWNER' ? 'text-red-600 border-red-100 bg-red-50' :
                                                                    member.role === 'EDITOR' ? 'text-blue-600 border-blue-100 bg-blue-50' :
                                                                        'text-slate-600 border-slate-100 bg-slate-50'
                                                                    }`}
                                                            >
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="OWNER">Owner</SelectItem>
                                                                <SelectItem value="EDITOR">Editor</SelectItem>
                                                                <SelectItem value="VIEWER">Viewer</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <Badge
                                                            className={`h-7 px-3 text-[10px] font-bold tracking-tight border shadow-none ${member.role === 'OWNER' ? 'bg-red-50 text-red-600 border-red-100' :
                                                                member.role === 'EDITOR' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                    'bg-slate-50 text-slate-600 border-slate-100'
                                                                }`}
                                                        >
                                                            {member.role}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                {canManageMembers && canDelete(user?.role) && (
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleRemoveMember(userId)}
                                                            disabled={loading}
                                                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
