"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { userService } from "@/services/userService";
import { clientService } from "@/services/clientService";
import { useAuth } from "./auth-context";
import { useCompany } from "./company-context";
import { toast } from "sonner";

// Types
export interface Admin {
    id: string;
    name: string;
    email: string;
    status: "ACTIVE" | "INACTIVE";
    clientsAssigned: number;
    maxClients: number;
    phone?: string;
    utilizationPercentage?: number;
}

interface ServerStats {
    uptimeSeconds: number;
    uptimeFormatted: string;
    uptimePercentage: number;
    serverStartTime: string;
}

export interface Client {
    id: string;
    name: string;
    companyName: string;
    status: "ACTIVE" | "INACTIVE";
    assignedAdminId: string | null;
    pendingWork: number;
    completedWork: number;
    email?: string;
    phone?: string;
    joinedDate?: string;
}

interface SuperAdminContextType {
    serverStats: ServerStats | null;
    admins: Admin[];
    clients: Client[];
    allUsers: any[];
    loading: boolean;
    error: string | null;
    refreshAdmins: () => Promise<void>;
    refreshClients: () => Promise<void>;
    refreshAllUsers: () => Promise<void>;
    updateAdminStatus: (adminId: string) => Promise<void>;
    updateUserStatus: (userId: string) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    assignClient: (clientId: string, adminId: string | null) => Promise<void>;
    addAdmin: (name: string, email: string, password: string, phone?: string) => Promise<void>;
    deleteAdmin: (adminId: string) => Promise<void>;
    addClient: (data: any) => Promise<void>;
    updateClient: (clientId: string, updates: Partial<Client>) => Promise<void>;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

export function SuperAdminProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { selectedCompany } = useCompany();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [serverStats, setServerStats] = useState<ServerStats | null>(null);

    const fetchServerStats = async () => {
        try {
            const data = await userService.getServerStats();
            setServerStats(data);
        } catch (error) {
            console.error('Failed to fetch server stats', error);
        }
    };
    useEffect(() => {
        if (!user || user.role !== "SUPER_ADMIN") {
            setServerStats(null);
            return;
        }
        fetchServerStats();
        const interval = setInterval(fetchServerStats, 60000);

        return () => {
            clearInterval(interval);
        };
    }, [user?.role]);


    // Fetch admins from API
    const refreshAdmins = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await userService.getAllAdmins(selectedCompany?._id);

            const transformedAdmins: Admin[] = response.admins.map((admin) => ({
                id: admin.id,
                name: admin.name,
                email: admin.email,
                phone: admin.phone,
                status: admin.status,
                clientsAssigned: admin.utilization.clientCount,
                maxClients: admin.utilization.maxClients,
                utilizationPercentage: Math.round(
                    (admin.utilization.clientCount / admin.utilization.maxClients) * 100
                ),
            }));

            setAdmins(transformedAdmins);
        } catch (err: any) {
            console.error("Error fetching admins:", err);
            setError(err.response?.data?.message || "Failed to fetch admins");
        } finally {
            setLoading(false);
        }
    };

    // Fetch clients from API
    const refreshClients = async (companyId?: string) => {
        try {
            setLoading(true);
            const response = await clientService.getAllClients({ company: companyId });

            const transformedClients: Client[] = response.clients.map((client) => ({
                id: client._id,
                name: client.name,
                companyName: client.companyName,
                status: client.status,
                assignedAdminId: client.assignedAdmin?._id || null,
                pendingWork: client.pendingWork || 0,
                completedWork: client.completedWork || 0,
                email: client.email,
                phone: client.phone,
                joinedDate: new Date(client.joinedDate || client.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }),
            }));

            setClients(transformedClients);
        } catch (err: any) {
            console.error("Error fetching clients:", err);
            setError(err.response?.data?.message || "Failed to fetch clients");
        } finally {
            setLoading(false);
        }
    };

    // Fetch all users for management
    const refreshAllUsers = async () => {
        try {
            setLoading(true);
            const response = await userService.getAllUsers();
            setAllUsers(response.users);
        } catch (err: any) {
            console.error("Error fetching users:", err);
            setError(err.response?.data?.message || "Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    // Load initial global data on mount (only for SUPER_ADMIN)
    useEffect(() => {
        if (user?.role === "SUPER_ADMIN") {
            refreshAdmins();
            refreshClients();
            refreshAllUsers();
        }
    }, [user]);

    // ✅ OPTIMISTIC: Update admin status
    const updateAdminStatus = async (adminId: string) => {
        const admin = admins.find((a) => a.id === adminId);
        if (!admin) return;

        const newStatus = admin.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        const previousAdmins = [...admins]; // Backup

        // 1. Update UI immediately
        setAdmins((prev) =>
            prev.map((a) => (a.id === adminId ? { ...a, status: newStatus } : a))
        );

        try {
            // 2. Call API in background
            const response = await userService.updateAdminStatus(adminId, { status: newStatus });
            toast.success(response.message || `Admin ${newStatus.toLowerCase()}d successfully`);
        } catch (err: any) {
            // 3. Rollback on error
            setAdmins(previousAdmins);
            toast.error(err.response?.data?.message || "Failed to update admin status");
        }
    };

    // ✅ OPTIMISTIC: Create new admin (only show loading for create)
    const addAdmin = async (name: string, email: string, password: string, phone?: string) => {
        try {
            setLoading(true); // Keep loading for creation
            const response = await userService.createAdmin({ name, email, password, phone });
            toast.success(response.message || "Admin created successfully");
            await refreshAdmins();
        } catch (err: any) {
            console.error("Error creating admin:", err);
            toast.error(err.response?.data?.message || "Failed to create admin");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // ✅ OPTIMISTIC: Delete admin
    const deleteAdmin = async (adminId: string) => {
        const previousAdmins = [...admins]; // Backup

        // 1. Remove from UI immediately
        setAdmins((prev) => prev.filter((a) => a.id !== adminId));

        try {
            // 2. Call API in background
            const response = await userService.deleteAdmin(adminId);
            toast.success(response.message || "Admin deleted successfully");
            await refreshAllUsers(); // Sync users list in background
        } catch (err: any) {
            console.error("Error deleting admin:", err);
            // 3. Rollback on error
            setAdmins(previousAdmins);
            toast.error(err.response?.data?.message || "Failed to delete admin");
            throw err;
        }
    };

    // ✅ OPTIMISTIC: Update user status
    const updateUserStatus = async (userId: string) => {
        const user = allUsers.find((u) => u._id === userId);
        if (!user) {
            toast.error("User not found");
            return;
        }

        const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        const previousUsers = [...allUsers]; // Backup

        // 1. Update UI immediately
        setAllUsers((prev) =>
            prev.map((u) => (u._id === userId ? { ...u, status: newStatus } : u))
        );

        try {
            // 2. Call API in background
            const response = await userService.updateUserStatus(userId, { status: newStatus });
            toast.success(response.message || `User status updated to ${newStatus}`);
        } catch (err: any) {
            console.error("Error updating user status:", err);
            // 3. Rollback on error
            setAllUsers(previousUsers);
            toast.error(err.response?.data?.message || "Failed to update user status");
            throw err;
        }
    };

    // ✅ OPTIMISTIC: Delete user
    const deleteUser = async (userId: string) => {
        const previousUsers = [...allUsers]; // Backup
        const previousAdmins = [...admins]; // Backup if user was admin

        // 1. Remove from UI immediately
        setAllUsers((prev) => prev.filter((u) => u._id !== userId));
        setAdmins((prev) => prev.filter((a) => a.id !== userId));

        try {
            // 2. Call API in background
            const response = await userService.deleteUser(userId);
            toast.success(response.message || "User deleted successfully");
        } catch (err: any) {
            console.error("Error deleting user:", err);
            // 3. Rollback on error
            setAllUsers(previousUsers);
            setAdmins(previousAdmins);
            toast.error(err.response?.data?.message || "Failed to delete user");
            throw err;
        }
    };

    // ✅ OPTIMISTIC: Assign client
    const assignClient = async (clientId: string, newAdminId: string | null) => {
        const previousClients = [...clients]; // Backup
        const previousAdmins = [...admins]; // Backup

        // 1. Update UI immediately
        setClients((prev) =>
            prev.map((c) =>
                c.id === clientId ? { ...c, assignedAdminId: newAdminId } : c
            )
        );

        try {
            // 2. Call API in background
            let response;
            if (newAdminId) {
                response = await clientService.assignClientToAdmin(clientId, newAdminId);
            } else {
                response = await clientService.unassignClient(clientId);
            }
            toast.success(response.message || "Client assignment updated");

            // Refresh in background to get accurate counts
            refreshAdmins();
        } catch (err: any) {
            console.error("Error assigning client:", err);
            // 3. Rollback on error
            setClients(previousClients);
            setAdmins(previousAdmins);
            toast.error(err.response?.data?.message || "Failed to assign client");
            throw err;
        }
    };

    // Keep loading for create operations
    const addClient = async (data: any) => {
        try {
            setLoading(true);
            const response = await clientService.createClient(data);
            toast.success(response.message || "Client added successfully");
            await refreshClients();
        } catch (err: any) {
            console.error("Error adding client:", err);
            toast.error(err.response?.data?.message || "Failed to add client");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // ✅ OPTIMISTIC: Update client
    const updateClient = async (clientId: string, updates: Partial<Client>) => {
        const previousClients = [...clients]; // Backup

        // 1. Update UI immediately
        setClients((prev) =>
            prev.map((c) => (c.id === clientId ? { ...c, ...updates } : c))
        );

        try {
            // 2. Call API in background
            const response = await clientService.updateClient(clientId, updates as any);
            toast.success(response.message || "Client updated successfully");
        } catch (err: any) {
            console.error("Error updating client:", err);
            // 3. Rollback on error
            setClients(previousClients);
            toast.error(err.response?.data?.message || "Failed to update client");
            throw err;
        }
    };

    return (
        <SuperAdminContext.Provider
            value={{
                serverStats,
                admins,
                clients,
                allUsers,
                loading,
                error,
                refreshAdmins,
                refreshClients,
                refreshAllUsers,
                updateAdminStatus,
                updateUserStatus,
                deleteUser,
                assignClient,
                addAdmin,
                deleteAdmin,
                addClient,
                updateClient,
            }}
        >
            {children}
        </SuperAdminContext.Provider>
    );
}

export function useSuperAdmin() {
    const context = useContext(SuperAdminContext);
    if (context === undefined) {
        throw new Error("useSuperAdmin must be used within a SuperAdminProvider");
    }
    return context;
}
