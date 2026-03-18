"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import serviceService, { Service } from "@/services/serviceService";
import { toast } from "sonner";
import { useAuth } from "./auth-context";

interface ServiceContextType {
    services: Service[];
    loading: boolean;
    error: string | null;
    fetchServices: (force?: boolean, params?: { page?: number; limit?: number }) => Promise<void>;
    getServiceById: (id: string) => Promise<Service | null>;
    createService: (data: Partial<Service>) => Promise<void>;
    updateService: (id: string, data: Partial<Service>) => Promise<void>;
    deleteService: (id: string) => Promise<void>;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalDocs: number;
    };
    setPage: (page: number) => void;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

const CACHE_DURATION = 60000; // 1 minute

export function ServiceProvider({ children }: { children: React.ReactNode }) {
    const [services, setServices] = useState<Service[]>([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalDocs: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { isAuthenticated } = useAuth();

    const lastFetchTime = useRef<number>(0);
    const isFetching = useRef<boolean>(false);
    const lastFetchParams = useRef<string>("");

    const fetchServices = useCallback(async (force: boolean = false, params: { page?: number; limit?: number } = {}) => {
        const now = Date.now();
        const paramsStr = JSON.stringify(params);
        if (!force && now - lastFetchTime.current < CACHE_DURATION && services.length > 0 && paramsStr === lastFetchParams.current) {
            return;
        }

        if (isFetching.current && paramsStr === lastFetchParams.current) return;
        isFetching.current = true;
        lastFetchParams.current = paramsStr;

        if (!lastFetchTime.current) {
            setLoading(true);
        }
        setError(null);
        try {
            const response = await serviceService.getAllServices(params);
            setServices(response.services as any);
            setPagination({
                currentPage: response.currentPage || 1,
                totalPages: response.totalPages || 1,
                totalDocs: response.count || 0
            });
            lastFetchTime.current = Date.now();
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to fetch services";
            setError(msg);
            if (force) toast.error(msg);
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    }, []); // Stable fetcher

    const getServiceById = useCallback(async (id: string) => {
        // Individual service fetch doesn't use the main services cache for now
        setLoading(true);
        try {
            return await serviceService.getServiceById(id);
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to fetch service";
            toast.error(msg);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createService = useCallback(async (data: Partial<Service>) => {
        const previousServices = [...services];
        const tempId = `temp-${Date.now()}`;
        const optimisticService = { ...data, id: tempId, title: data.title || "Untitled" } as Service;
        
        setServices(prev => [optimisticService, ...prev]);

        try {
            await serviceService.createService(data);
            toast.success("Service created successfully");
            fetchServices(true, { page: pagination.currentPage, limit: 12 });
        } catch (err: any) {
            setServices(previousServices);
            const msg = err.response?.data?.message || "Failed to create service";
            toast.error(msg);
        }
    }, [services, fetchServices, pagination.currentPage]);

    const updateService = useCallback(async (id: string, data: Partial<Service>) => {
        const previousServices = [...services];
        setServices(prev => prev.map(s => s.id === id ? { ...s, ...data } as Service : s));

        try {
            await serviceService.updateService(id, data);
            toast.success("Service updated successfully");
        } catch (err: any) {
            setServices(previousServices);
            const msg = err.response?.data?.message || "Failed to update service";
            toast.error(msg);
        }
    }, [services]);

    const deleteService = useCallback(async (id: string) => {
        const previousServices = [...services];
        setServices(prev => prev.filter(s => s.id !== id));

        try {
            await serviceService.deleteService(id);
            toast.success("Service deleted successfully");
        } catch (err: any) {
            setServices(previousServices);
            const msg = err.response?.data?.message || "Failed to delete service";
            toast.error(msg);
        }
    }, [services]);

    // Initial load & Pagination sync
    useEffect(() => {
        if (isAuthenticated) {
            fetchServices(false, { page: pagination.currentPage, limit: 12 });
        }
    }, [isAuthenticated, fetchServices, pagination.currentPage]);

    const setPage = useCallback((page: number) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    }, []);

    const value = React.useMemo(() => ({
        services, 
        loading, 
        error, 
        fetchServices, 
        getServiceById,
        createService,
        updateService,
        deleteService,
        pagination,
        setPage
    }), [
        services, loading, error, fetchServices, getServiceById,
        createService, updateService, deleteService, pagination, setPage
    ]);

    return (
        <ServiceContext.Provider value={value}>
            {children}
        </ServiceContext.Provider>
    );
}

export function useService() {
    const context = useContext(ServiceContext);
    if (context === undefined) {
        throw new Error("useService must be used within a ServiceProvider");
    }
    return context;
}
