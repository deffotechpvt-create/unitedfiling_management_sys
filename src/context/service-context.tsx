"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import serviceService, { Service } from "@/services/serviceService";
import { toast } from "sonner";
import { useAuth } from "./auth-context";

interface ServiceContextType {
    services: Service[];
    loading: boolean;
    error: string | null;
    fetchServices: (force?: boolean) => Promise<void>;
    getServiceById: (id: string) => Promise<Service | null>;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

const CACHE_DURATION = 60000; // 1 minute

export function ServiceProvider({ children }: { children: React.ReactNode }) {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { isAuthenticated } = useAuth();

    const lastFetchTime = useRef<number>(0);
    const isFetching = useRef<boolean>(false);

    const fetchServices = useCallback(async (force: boolean = false) => {
        const now = Date.now();
        if (!force && now - lastFetchTime.current < CACHE_DURATION && services.length > 0) {
            return;
        }

        if (isFetching.current) return;
        isFetching.current = true;

        setLoading(true);
        setError(null);
        try {
            const fetchedServices = await serviceService.getAllServices();
            setServices(fetchedServices);
            lastFetchTime.current = Date.now();
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to fetch services";
            setError(msg);
            if (force) toast.error(msg);
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    }, [services.length]);

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

    // Initial load
    useEffect(() => {
        if (isAuthenticated) {
            fetchServices(false);
        }
    }, [isAuthenticated, fetchServices]);

    return (
        <ServiceContext.Provider value={{ services, loading, error, fetchServices, getServiceById }}>
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
