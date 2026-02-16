"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import complianceService, { ComplianceRecord } from "@/services/complianceService";
import { toast } from "sonner";
import { useCompany } from "./company-context";
import { useAuth } from "./auth-context";

interface ComplianceStats {
    total: number;
    pending: number;
    delayed: number;
    completed: number;
}

interface ComplianceContextType {
    compliances: ComplianceRecord[];
    stats: ComplianceStats | null;
    loading: boolean;
    error: string | null;
    fetchCompliances: (companyId?: string) => Promise<void>;
    fetchStats: (companyId?: string) => Promise<void>;
}

const ComplianceContext = createContext<ComplianceContextType | undefined>(undefined);

export function ComplianceProvider({ children }: { children: React.ReactNode }) {
    const [compliances, setCompliances] = useState<ComplianceRecord[]>([]);
    const [stats, setStats] = useState<ComplianceStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { selectedCompany } = useCompany();

    const fetchCompliances = useCallback(async (companyId?: string) => {
        setLoading(true);
        setError(null);
        try {
            const fetched = await complianceService.getAllCompliances(companyId || selectedCompany?._id);
            setCompliances(fetched);
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to fetch compliances";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, [selectedCompany?._id]);

    const fetchStats = useCallback(async (companyId?: string) => {
        setLoading(true);
        try {
            const fetchedStats = await complianceService.getStats(companyId || selectedCompany?._id);
            setStats(fetchedStats);
        } catch (err: any) {
            console.error("Failed to fetch compliance stats:", err);
        } finally {
            setLoading(false);
        }
    }, [selectedCompany?._id]);

    const { user } = useAuth();

    // ✅ React to global company selection (Only for non-SuperAdmins and non-Admins)
    React.useEffect(() => {
        if (user && user.role !== "SUPER_ADMIN" && user.role !== "ADMIN") {
            fetchCompliances();
            fetchStats();
        }
    }, [selectedCompany?._id, user?.role]);

    // Initial load on mount for Super Admin or anyone else
    React.useEffect(() => {
        if (user) {
            fetchCompliances();
            fetchStats();
        }
    }, []);

    return (
        <ComplianceContext.Provider value={{ compliances, stats, loading, error, fetchCompliances, fetchStats }}>
            {children}
        </ComplianceContext.Provider>
    );
}

export function useCompliance() {
    const context = useContext(ComplianceContext);
    if (context === undefined) {
        throw new Error("useCompliance must be used within a ComplianceProvider");
    }
    return context;
}
