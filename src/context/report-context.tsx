// src/context/report-context.tsx
"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { reportService, ReportStats, HighRiskCompliance } from "@/services/reportService";
import { toast } from "sonner";
import { useAuth } from "./auth-context";
import { useCompany } from "./company-context";
import { isSuperAdmin } from "@/lib/roles";

interface ReportContextType {
    stats: ReportStats | null;
    highRiskCompliances: HighRiskCompliance[];
    loading: boolean;
    error: string | null;
    fetchStats: (companyId?: string, force?: boolean) => Promise<void>;
    fetchHighRisk: (companyId?: string, force?: boolean) => Promise<void>;
    refreshAll: (companyId?: string, force?: boolean) => Promise<void>;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

const CACHE_DURATION = 60000; // 1 minute

export function ReportProvider({ children }: { children: React.ReactNode }) {
    const [stats, setStats] = useState<ReportStats | null>(null);
    const [highRiskCompliances, setHighRiskCompliances] = useState<HighRiskCompliance[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user, isAuthenticated } = useAuth();
    const { selectedCompany } = useCompany();

    const lastFetchTime = useRef<{ stats: number; highRisk: number }>({ stats: 0, highRisk: 0 });
    const isFetching = useRef<{ stats: boolean; highRisk: boolean }>({ stats: false, highRisk: false });

    const fetchStats = useCallback(async (companyId?: string, force: boolean = false) => {
        if (!isSuperAdmin(user?.role)) return;

        const now = Date.now();
        if (!force && now - lastFetchTime.current.stats < CACHE_DURATION && stats !== null) {
            return;
        }

        if (isFetching.current.stats) return;
        isFetching.current.stats = true;

        setLoading(true);
        setError(null);
        try {
            const response = await reportService.getOverview(companyId || selectedCompany?._id);
            setStats(response.stats);
            lastFetchTime.current.stats = Date.now();
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to fetch report stats";
            setError(msg);
            if (force) toast.error(msg);
        } finally {
            setLoading(false);
            isFetching.current.stats = false;
        }
    }, [user?.role, stats, selectedCompany?._id]);

    const fetchHighRisk = useCallback(async (companyId?: string, force: boolean = false) => {
        if (!isSuperAdmin(user?.role)) return;

        const now = Date.now();
        if (!force && now - lastFetchTime.current.highRisk < CACHE_DURATION && highRiskCompliances.length > 0) {
            return;
        }

        if (isFetching.current.highRisk) return;
        isFetching.current.highRisk = true;

        try {
            const response = await reportService.getHighRiskCompliances(companyId || selectedCompany?._id);
            setHighRiskCompliances(response.compliances);
            lastFetchTime.current.highRisk = Date.now();
        } catch (err: any) {
            console.error("Failed to fetch high risk compliances");
        } finally {
            isFetching.current.highRisk = false;
        }
    }, [user?.role, highRiskCompliances.length, selectedCompany?._id]);

    const refreshAll = useCallback(async (companyId?: string, force: boolean = true) => {
        await Promise.all([
            fetchStats(companyId, force),
            fetchHighRisk(companyId, force)
        ]);
    }, [fetchStats, fetchHighRisk]);

    // Initial loading
    useEffect(() => {
        if (!isAuthenticated || !user || !isSuperAdmin(user.role)) {
            setStats(null);
            setHighRiskCompliances([]);
            lastFetchTime.current = { stats: 0, highRisk: 0 };
            return;
        }

        refreshAll(undefined, false);
    }, [user?._id, user?.role, isAuthenticated, selectedCompany?._id, refreshAll]);

    return (
        <ReportContext.Provider
            value={{
                stats,
                highRiskCompliances,
                loading,
                error,
                fetchStats,
                fetchHighRisk,
                refreshAll
            }}
        >
            {children}
        </ReportContext.Provider>
    );
}

export function useReport() {
    const context = useContext(ReportContext);
    if (context === undefined) {
        throw new Error("useReport must be used within a ReportProvider");
    }
    return context;
}
