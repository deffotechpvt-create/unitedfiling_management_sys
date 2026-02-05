// src/context/client-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, use } from "react";
import { clientService, Client, ClientStats, CreateClientData, UpdateClientData, ClientFilters } from "@/services/clientService";
import { toast } from "sonner";
import { useAuth } from "./auth-context";

interface ClientContextType {
    clients: Client[];
    selectedClient: Client | null;
    stats: ClientStats | null;
    loading: boolean;
    error: string | null;
    filters: ClientFilters;

    // CRUD operations
    getAllClients: (filters?: ClientFilters) => Promise<void>;
    getClientById: (clientId: string) => Promise<void>;
    createClient: (data: CreateClientData) => Promise<void>;
    updateClient: (clientId: string, data: UpdateClientData) => Promise<void>;
    deleteClient: (clientId: string) => Promise<void>;

    // Assignment operations
    assignClientToAdmin: (clientId: string, adminId: string) => Promise<void>;
    unassignClient: (clientId: string) => Promise<void>;
    getUnassignedClients: () => Promise<void>;

    // Statistics
    getClientStats: () => Promise<void>;

    // Filters and selection
    setFilters: (filters: ClientFilters) => void;
    setSelectedClient: (client: Client | null) => void;
    clearError: () => void;
    refreshClients: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [stats, setStats] = useState<ClientStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<ClientFilters>({});
    const { user } = useAuth();

    // Load clients on mount
    useEffect(() => {
        if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
            // getAllClients();
            getClientStats();
        }
    }, [user]);

    // Reload clients when filters change
    useEffect(() => {
        if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
            getAllClients(filters);
        }
    }, [filters,user]);

    const getAllClients = async (filterParams?: ClientFilters) => {
        try {
            setError(null);
            setLoading(true);

            const response = await clientService.getAllClients(filterParams || filters);

            if (response.clients) {
                setClients(response.clients);
            } else {
                throw new Error(response.message || "Failed to fetch clients");
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Failed to fetch clients";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getClientById = async (clientId: string) => {
        try {
            setError(null);
            setLoading(true);

            const response = await clientService.getClientById(clientId);

            if (response.client) {
                setSelectedClient(response.client);
            } else {
                throw new Error(response.message || "Failed to fetch client");
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Failed to fetch client";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const createClient = async (data: CreateClientData) => {
        try {
            setError(null);
            setLoading(true);

            const response = await clientService.createClient(data);

            if (response.client) {
                toast.success(response.message || "Client created successfully");
                await refreshClients();
            } else {
                throw new Error(response.message || "Failed to create client");
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Failed to create client";
            setError(errorMessage);
            toast.error(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const updateClient = async (clientId: string, data: UpdateClientData) => {
        try {
            setError(null);
            setLoading(true);

            const response = await clientService.updateClient(clientId, data);

            if (response.client) {
                toast.success(response.message || "Client updated successfully");
                await refreshClients();

                // Update selected client if it's the one being updated
                if (selectedClient?._id === clientId) {
                    setSelectedClient(response.client);
                }
            } else {
                throw new Error(response.message || "Failed to update client");
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Failed to update client";
            setError(errorMessage);
            toast.error(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const deleteClient = async (clientId: string) => {
        try {
            setError(null);
            setLoading(true);

            const response = await clientService.deleteClient(clientId);

            toast.success(response.message || "Client deleted successfully");
            await refreshClients();

            // Clear selected client if it was deleted
            if (selectedClient?._id === clientId) {
                setSelectedClient(null);
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Failed to delete client";
            setError(errorMessage);
            toast.error(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const assignClientToAdmin = async (clientId: string, adminId: string) => {
        try {
            setError(null);
            setLoading(true);

            const response = await clientService.assignClientToAdmin(clientId, adminId);

            if (response.client) {
                toast.success(response.message || "Client assigned successfully");
                await refreshClients();

                // Update selected client if it's the one being assigned
                if (selectedClient?._id === clientId) {
                    setSelectedClient(response.client);
                }
            } else {
                throw new Error(response.message || "Failed to assign client");
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Failed to assign client";
            setError(errorMessage);
            toast.error(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const unassignClient = async (clientId: string) => {
        try {
            setError(null);
            setLoading(true);

            const response = await clientService.unassignClient(clientId);

            if (response.client) {
                toast.success(response.message || "Client unassigned successfully");
                await refreshClients();

                // Update selected client if it's the one being unassigned
                if (selectedClient?._id === clientId) {
                    setSelectedClient(response.client);
                }
            } else {
                throw new Error(response.message || "Failed to unassign client");
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Failed to unassign client";
            setError(errorMessage);
            toast.error(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getUnassignedClients = async () => {
        try {
            setError(null);
            setLoading(true);

            const response = await clientService.getUnassignedClients();

            if (response.clients) {
                setClients(response.clients);
            } else {
                throw new Error(response.message || "Failed to fetch unassigned clients");
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Failed to fetch unassigned clients";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getClientStats = async () => {
        try {
            setError(null);

            const response = await clientService.getClientStats();

            if (response.stats) {
                setStats(response.stats);
            } else {
                throw new Error(response.message || "Failed to fetch statistics");
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Failed to fetch statistics";
            setError(errorMessage);
            console.error(errorMessage);
        }
    };

    const refreshClients = async () => {
        await getAllClients(filters);
        await getClientStats();
    };

    const clearError = () => {
        setError(null);
    };

    const value: ClientContextType = {
        clients,
        selectedClient,
        stats,
        loading,
        error,
        filters,
        getAllClients,
        getClientById,
        createClient,
        updateClient,
        deleteClient,
        assignClientToAdmin,
        unassignClient,
        getUnassignedClients,
        getClientStats,
        setFilters,
        setSelectedClient,
        clearError,
        refreshClients,
    };

    return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
}

export function useClient() {
    const context = useContext(ClientContext);
    if (context === undefined) {
        throw new Error("useClient must be used within a ClientProvider");
    }
    return context;
}
