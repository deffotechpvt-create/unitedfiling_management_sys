"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import serviceService, { Service } from "@/services/serviceService";
import { toast } from "sonner";

interface ServiceContextType {
    services: Service[];
    loading: boolean;
    error: string | null;
    fetchServices: () => Promise<void>;
    getServiceById: (id: string) => Promise<Service | null>;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export function ServiceProvider({ children }: { children: React.ReactNode }) {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchServices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const fetchedServices = await serviceService.getAllServices();
            setServices(fetchedServices);
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to fetch services";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    const getServiceById = useCallback(async (id: string) => {
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
