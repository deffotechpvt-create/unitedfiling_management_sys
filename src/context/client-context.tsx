// src/context/client-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { clientService, Client, ClientStats, CreateClientData, UpdateClientData, ClientFilters } from "@/services/clientService";
import { toast } from "sonner";
import { useAuth } from "./auth-context";
import { canManageClients, ROLES } from "@/lib/roles";

interface ClientContextType {
    clients: Client[];
    selectedClient: Client | null;
    stats: ClientStats | null;
    loading: boolean;
    error: string | null;
    filters: ClientFilters;
    pagination: { page: number; limit: number; totalPages: number; totalCount: number };

    // CRUD operations
    getAllClients: (force?: boolean, filters?: ClientFilters) => Promise<void>;
    getClientById: (clientId: string) => Promise<void>;
    createClient: (data: CreateClientData) => Promise<void>;
    updateClient: (clientId: string, data: UpdateClientData) => Promise<void>;
    deleteClient: (clientId: string) => Promise<void>;

    // Assignment operations
    assignClientToAdmin: (clientId: string, adminId: string) => Promise<void>;
    unassignClient: (clientId: string) => Promise<void>;
    getUnassignedClients: () => Promise<void>;

    // Statistics
    getClientStats: (force?: boolean) => Promise<void>;

    // Filters and selection
    setFilters: (filters: ClientFilters | ((prev: ClientFilters) => ClientFilters)) => void;
    setPage: (page: number) => void;
    setSelectedClient: (client: Client | null) => void;
    clearError: () => void;
    refreshAll: (force?: boolean) => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

const CACHE_DURATION = 60000; // 1 minute

export function ClientProvider({ children }: { children: React.ReactNode }) {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [stats, setStats] = useState<ClientStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFiltersState] = useState<ClientFilters>({});
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalCount: 0 });
    
    const { user, isAuthenticated } = useAuth();

    const lastFetchTime = useRef<{ clients: number; stats: number }>({ clients: 0, stats: 0 });
    const isFetching = useRef<{ clients: boolean; stats: boolean }>({ clients: false, stats: false });

    const getAllClients = useCallback(async (force: boolean = false, filterParams?: ClientFilters) => {
        const now = Date.now();
        const activeFilters = { ...pagination, ...(filterParams || filters) }; // mix in page and limit

        // Cache skip logic
        if (!force && !filterParams && now - lastFetchTime.current.clients < CACHE_DURATION && clients.length > 0) {
            return;
        }

        if (isFetching.current.clients) return;
        isFetching.current.clients = true;

        try {
            setError(null);
            if (clients.length === 0) setLoading(true);

            const response = await clientService.getAllClients(activeFilters);

            if (response.clients) {
                setClients(response.clients);
                setPagination(prev => ({
                    ...prev,
                    totalPages: response.totalPages || 1,
                    totalCount: response.count || 0
                }));
                lastFetchTime.current.clients = Date.now();
            } else {
                throw new Error(response.message || "Failed to fetch clients");
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Failed to fetch clients";
            setError(errorMessage);
            if (force) toast.error(errorMessage);
        } finally {
            setLoading(false);
            isFetching.current.clients = false;
        }
    }, [filters, pagination.page, pagination.limit]);

    const getClientById = useCallback(async (clientId: string) => {
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
    }, []);

    const getClientStats = useCallback(async (force: boolean = false) => {
        const now = Date.now();
        if (!force && now - lastFetchTime.current.stats < CACHE_DURATION && stats !== null) {
            return;
        }

        if (isFetching.current.stats) return;
        isFetching.current.stats = true;

        try {
            setError(null);
            const response = await clientService.getClientStats(filters.company);

            if (response.stats) {
                setStats(response.stats);
                lastFetchTime.current.stats = Date.now();
            } else {
                throw new Error(response.message || "Failed to fetch statistics");
            }
        } catch (err: any) {
            console.error("Failed to fetch client stats", err);
        } finally {
            isFetching.current.stats = false;
        }
    }, [filters.company]);

    const refreshAll = useCallback(async (force: boolean = true) => {
        await Promise.all([
            getAllClients(force),
            getClientStats(force)
        ]);
    }, [getAllClients, getClientStats]);

    const setFilters = useCallback((newFilters: ClientFilters | ((prev: ClientFilters) => ClientFilters)) => {
        setFiltersState(newFilters);
        setPagination(prev => ({ ...prev, page: 1 })); // reset page on filter change
    }, []);

    const setPage = useCallback((page: number) => {
        setPagination(prev => ({ ...prev, page }));
    }, []);

    // Effect for handling initial load and role/auth changes
    useEffect(() => {
        if (!isAuthenticated || !user || !canManageClients(user.role)) {
            setClients([]);
            setStats(null);
            lastFetchTime.current = { clients: 0, stats: 0 };
            return;
        }

        refreshAll(false);
    }, [user?._id, user?.role, isAuthenticated, refreshAll]);

    // Effect for handling filter changes
    useEffect(() => {
        if (isAuthenticated && user && canManageClients(user.role)) {
            // Proper debounce for search typing and filter changes
            const timer = setTimeout(() => {
                refreshAll(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [filters, pagination.page, user?.role, isAuthenticated, refreshAll]);


    const createClient = async (data: CreateClientData) => {
        try {
            setError(null);
            await clientService.createClient(data);
            toast.success("Client created");
            refreshAll(true);
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
            const previousClients = [...clients];
            setClients(prev => prev.map(c => c._id === clientId ? { ...c, ...data } as Client : c));

            await clientService.updateClient(clientId, data);
            toast.success("Client updated");
            refreshAll(true);
        } catch (err: any) {
            // rollback logic would go here if we had simple state, but refreshAll handles it
            toast.error(err.response?.data?.message || err.message || "Failed to update client");
            refreshAll(true);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteClient = async (clientId: string) => {
        try {
            setError(null);
            setClients(prev => prev.filter(c => c._id !== clientId));
            await clientService.deleteClient(clientId);
            toast.success("Client deleted");
            refreshAll(true);
            if (selectedClient?._id === clientId) {
                setSelectedClient(null);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.message || "Failed to delete client");
            refreshAll(true);
        } finally {
            setLoading(false);
        }
    };

    const assignClientToAdmin = async (clientId: string, adminId: string) => {
        try {
            setError(null);
            await clientService.assignClientToAdmin(clientId, adminId);
            toast.success("Client assigned");
            refreshAll(true);
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.message || "Failed to assign client");
        } finally {
            setLoading(false);
        }
    };

    const unassignClient = async (clientId: string) => {
        try {
            setError(null);
            await clientService.unassignClient(clientId);
            toast.success("Client unassigned");
            refreshAll(true);
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.message || "Failed to unassign client");
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
                throw new Error("Failed to fetch unassigned clients");
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Failed to fetch unassigned clients";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const value: ClientContextType = {
        clients,
        selectedClient,
        stats,
        loading,
        error,
        filters,
        pagination,
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
        setPage,
        setSelectedClient,
        clearError,
        refreshAll,
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
