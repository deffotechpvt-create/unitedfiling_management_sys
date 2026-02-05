"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { userService, AdminWithUtilization } from "@/services/userService";
import { useAuth } from "./auth-context";

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
    admins: Admin[];
    clients: Client[];
    loading: boolean;
    error: string | null;
    refreshAdmins: () => Promise<void>;
    updateAdminStatus: (adminId: string) => Promise<void>;
    assignClient: (clientId: string, adminId: string | null) => void;
    addAdmin: (name: string, email: string, password: string, phone?: string) => Promise<void>;
    deleteAdmin: (adminId: string) => Promise<void>;
    addClient: (client: Omit<Client, "id" | "status" | "pendingWork" | "completedWork">) => void;
    updateClient: (clientId: string, updates: Partial<Client>) => void;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

// Mock clients (will be replaced in Phase 2.2)
const mockClients: Client[] = [
    {
        id: "client-1",
        name: "Vikram Singh",
        companyName: "TechStart Solutions",
        status: "ACTIVE",
        assignedAdminId: null,
        pendingWork: 2,
        completedWork: 10,
        email: "vikram@techstart.com",
        phone: "+91 98765 43210",
        joinedDate: "12 Jan 2024",
    },
];

export function SuperAdminProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [clients, setClients] = useState<Client[]>(mockClients);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch admins from API
    const refreshAdmins = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await userService.getAllAdmins();

            // Transform API response to match Admin interface
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

    // Load admins on mount (only for SUPER_ADMIN)
    useEffect(() => {
        if (user?.role === "SUPER_ADMIN") {
            refreshAdmins();
        }
    }, [user]);

    // Update admin status (toggle ACTIVE/INACTIVE)
    const updateAdminStatus = async (adminId: string) => {
        try {
            const admin = admins.find((a) => a.id === adminId);
            if (!admin) return;

            const newStatus = admin.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

            await userService.updateAdminStatus(adminId, { status: newStatus });

            // Update local state
            setAdmins((prev) =>
                prev.map((a) => (a.id === adminId ? { ...a, status: newStatus } : a))
            );
        } catch (err: any) {
            console.error("Error updating admin status:", err);
            setError(err.response?.data?.message || "Failed to update admin status");
            throw err;
        }
    };

    // Create new admin
    const addAdmin = async (name: string, email: string, password: string, phone?: string) => {
        try {
            await userService.createAdmin({ name, email, password, phone });
            await refreshAdmins(); // Refresh list
        } catch (err: any) {
            console.error("Error creating admin:", err);
            setError(err.response?.data?.message || "Failed to create admin");
            throw err;
        }
    };

    // Delete admin
    const deleteAdmin = async (adminId: string) => {
        try {
            await userService.deleteAdmin(adminId);
            await refreshAdmins(); // Refresh list
        } catch (err: any) {
            console.error("Error deleting admin:", err);
            setError(err.response?.data?.message || "Failed to delete admin");
            throw err;
        }
    };

    // Client management (mock - will be real in Phase 2.2)
    const assignClient = (clientId: string, newAdminId: string | null) => {
        const client = clients.find((c) => c.id === clientId);
        if (!client) return;

        const oldAdminId = client.assignedAdminId;
        if (oldAdminId === newAdminId) return;

        setClients((prev) =>
            prev.map((c) => (c.id === clientId ? { ...c, assignedAdminId: newAdminId } : c))
        );

        setAdmins((prev) =>
            prev.map((a) => {
                let countChange = 0;
                if (a.id === newAdminId) countChange += 1;
                if (a.id === oldAdminId) countChange -= 1;

                if (countChange !== 0) {
                    return { ...a, clientsAssigned: Math.max(0, a.clientsAssigned + countChange) };
                }
                return a;
            })
        );
    };

    const addClient = (client: Omit<Client, "id" | "status" | "pendingWork" | "completedWork">) => {
        const newClient: Client = {
            id: `client-${Date.now()}`,
            status: "ACTIVE",
            pendingWork: 0,
            completedWork: 0,
            ...client,
        };
        setClients((prev) => [...prev, newClient]);
    };

    const updateClient = (clientId: string, updates: Partial<Client>) => {
        setClients((prev) => prev.map((client) => (client.id === clientId ? { ...client, ...updates } : client)));
    };

    return (
        <SuperAdminContext.Provider
            value={{
                admins,
                clients,
                loading,
                error,
                refreshAdmins,
                updateAdminStatus,
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
