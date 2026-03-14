// src/context/compliance-context.tsx
"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { complianceService, Compliance, ComplianceStats, UpdateComplianceData, ComplianceTemplate } from "@/services/complianceService";
import { userService } from "@/services/userService";
import { toast } from "sonner";
import { useAuth } from "./auth-context";
import { useCompany } from "./company-context";
import { ROLES, isSuperAdmin } from "@/lib/roles";

interface ComplianceContextType {
    compliances: Compliance[];
    stats: ComplianceStats | null;
    admins: { _id: string; name: string; email: string }[];
    templates: any[];
    loading: boolean;
    error: string | null;
    fetchCompliances: (companyId?: string, force?: boolean, filters?: { department?: string; category?: string | string[]; search?: string }) => Promise<void>;
    fetchStats: (companyId?: string, force?: boolean, filters?: { department?: string; category?: string | string[]; search?: string }) => Promise<void>;
    fetchTemplates: (force?: boolean) => Promise<void>;
    updateCompliance: (id: string, data: UpdateComplianceData) => Promise<void>;
    addAttachment: (id: string, url: string, note?: string) => Promise<void>;
    fetchAdminsForAssignment: (force?: boolean) => Promise<void>;
    refreshAll: (companyId?: string, force?: boolean, filters?: { department?: string; category?: string | string[]; search?: string }) => Promise<void>;
    createTemplate: (data: any) => Promise<void>;
    updateTemplate: (id: string, data: any) => Promise<void>;
    deleteTemplate: (id: string) => Promise<void>;
    deleteCompliances: (ids: string[]) => Promise<void>;
    globalSearch: string;
    setGlobalSearch: (value: string) => void;
}

const ComplianceContext = createContext<ComplianceContextType | undefined>(undefined);

const CACHE_DURATION = 30000; // 30 seconds

export function ComplianceProvider({ children }: { children: React.ReactNode }) {
    const [compliances, setCompliances] = useState<Compliance[]>([]);
    const [stats, setStats] = useState<ComplianceStats | null>(null);
    const [admins, setAdmins] = useState<{ _id: string; name: string; email: string }[]>([]);
    const [templates, setTemplates] = useState<ComplianceTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [globalSearch, setGlobalSearch] = useState("");
    const { user, isAuthenticated } = useAuth();
    const { selectedCompany } = useCompany();

    const lastFetchTime = useRef<{ compliances: number; stats: number; admins: number; templates: number }>({ 
        compliances: 0, 
        stats: 0,
        admins: 0,
        templates: 0
    });
    const isFetching = useRef<{ compliances: boolean; stats: boolean; admins: boolean; templates: boolean }>({ 
        compliances: false, 
        stats: false,
        admins: false,
        templates: false
    });
    const lastCompanyId = useRef<string | undefined>(undefined);
    const lastFiltersRef = useRef<string>("");

    const fetchCompliances = useCallback(async (companyId?: string, force: boolean = false, filters: { department?: string; category?: string | string[]; search?: string } = {}) => {
        const now = Date.now();
        const companyChanged = companyId !== lastCompanyId.current;
        const filtersStr = JSON.stringify(filters);
        const filtersChanged = filtersStr !== lastFiltersRef.current;

        // Skip cache if forced, company changed, or filters changed
        if (!force && !companyChanged && !filtersChanged && now - lastFetchTime.current.compliances < CACHE_DURATION) {
            return;
        }

        if (isFetching.current.compliances && !force && !companyChanged && !filtersChanged) return;
        
        lastFiltersRef.current = filtersStr;
        
        // Synchronous update to prevent race conditions
        lastCompanyId.current = companyId;
        isFetching.current.compliances = true;

        setLoading(true);
        setError(null);
        try {
            const response = await complianceService.getCompliances({ company: companyId, ...filters });
            setCompliances(response.compliances);
            lastFetchTime.current.compliances = Date.now();
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to fetch compliances";
            setError(msg);
            if (force) toast.error(msg);
        } finally {
            setLoading(false);
            isFetching.current.compliances = false;
        }
    }, []);

    const fetchStats = useCallback(async (companyId?: string, force: boolean = false, filters: { department?: string; category?: string | string[]; search?: string } = {}) => {
        const now = Date.now();
        const companyChanged = companyId !== lastCompanyId.current;
        const filtersStr = JSON.stringify(filters);
        const filtersChanged = filtersStr !== lastFiltersRef.current;

        if (!force && !companyChanged && !filtersChanged && now - lastFetchTime.current.stats < CACHE_DURATION) {
            return;
        }

        if (isFetching.current.stats && !force && !companyChanged && !filtersChanged) return;
        
        lastCompanyId.current = companyId;
        isFetching.current.stats = true;

        try {
            const response = await complianceService.getComplianceStats({ company: companyId, ...filters });
            setStats(response.stats);
            lastFetchTime.current.stats = Date.now();
        } catch (err: any) {
            console.error("Failed to fetch compliance stats", err);
        } finally {
            isFetching.current.stats = false;
        }
    }, []);

    const fetchAdminsForAssignment = useCallback(async (force: boolean = false) => {
        if (!isSuperAdmin(user?.role)) return;

        const now = Date.now();
        if (!force && now - lastFetchTime.current.admins < CACHE_DURATION) {
            return;
        }

        if (isFetching.current.admins) return;
        isFetching.current.admins = true;

        try {
            const response = await userService.getAdminsForAssignment();
            setAdmins(response.admins as any);
            lastFetchTime.current.admins = Date.now();
        } catch (err: any) {
            console.error("Failed to fetch admins for assignment", err);
        } finally {
            isFetching.current.admins = false;
        }
    }, [user?.role]);

    const fetchTemplates = useCallback(async (force: boolean = false) => {
        if (user?.role === ROLES.USER) return;

        const now = Date.now();
        if (!force && now - lastFetchTime.current.templates < CACHE_DURATION) {
            return;
        }
        if (isFetching.current.templates) return;
        isFetching.current.templates = true;

        try {
            const response = await complianceService.getTemplates();
            setTemplates(response.templates);
            lastFetchTime.current.templates = Date.now();
        } catch (err: any) {
            console.error("Failed to fetch templates", err);
        } finally {
            isFetching.current.templates = false;
        }
    }, []);

    const updateCompliance = async (id: string, data: UpdateComplianceData) => {
        setLoading(true);
        try {
            await complianceService.updateCompliance(id, data);
            toast.success("Compliance updated successfully");
            fetchCompliances(lastCompanyId.current, true);
            fetchStats(lastCompanyId.current, true);
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to update compliance";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const addAttachment = async (id: string, url: string, note?: string) => {
        setLoading(true);
        try {
            await complianceService.addAttachment(id, url, note);
            toast.success("Attachment added successfully");
            fetchCompliances(lastCompanyId.current, true);
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to add attachment";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const refreshAll = useCallback(async (companyId?: string, force: boolean = false, filters: { department?: string; category?: string | string[]; search?: string } = {}) => {
        // Allow companyId to be undefined for "All Companies" view
        await Promise.all([
            fetchCompliances(companyId, force, filters),
            fetchStats(companyId, force, filters),
        ]);
    }, [fetchCompliances, fetchStats]);

    // Role-aware and company-aware initial loading
    useEffect(() => {
        if (!isAuthenticated || !user) {
            setCompliances([]);
            setStats(null);
            setAdmins([]);
            setTemplates([]);
            lastFetchTime.current = { compliances: 0, stats: 0, admins: 0, templates: 0 };
            return;
        }

        // Only fetch global metadata on context initialization
        // Individual pages will trigger refreshAll as needed
        if (user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN) {
            fetchTemplates();
        }
        
        if (isSuperAdmin(user?.role)) {
            fetchAdminsForAssignment();
        }
    }, [user?._id, user?.role, isAuthenticated]);

    const createTemplate = async (data: any) => {
        setLoading(true);
        try {
            await complianceService.createTemplate(data);
            toast.success("Template created successfully");
            fetchTemplates(true);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to create template");
        } finally {
            setLoading(false);
        }
    };

    const updateTemplateRecord = async (id: string, data: any) => {
        setLoading(true);
        try {
            await complianceService.updateTemplate(id, data);
            toast.success("Template updated successfully");
            fetchTemplates(true);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update template");
        } finally {
            setLoading(false);
        }
    };

    const deleteTemplate = async (id: string) => {
        setLoading(true);
        try {
            await complianceService.deleteTemplate(id);
            toast.success("Template deleted successfully");
            fetchTemplates(true);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete template");
        } finally {
            setLoading(false);
        }
    };

    const deleteCompliances = useCallback(async (ids: string[]) => {
        setLoading(true);
        try {
            await complianceService.deleteCompliances(ids);
            toast.success("Compliances deleted successfully");
            await refreshAll(lastCompanyId.current, true);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete compliances");
        } finally {
            setLoading(false);
        }
    }, [refreshAll]);

    const value: ComplianceContextType = {
        compliances,
        stats,
        admins,
        templates,
        loading,
        error,
        fetchCompliances,
        fetchStats,
        fetchTemplates,
        updateCompliance,
        addAttachment,
        fetchAdminsForAssignment,
        refreshAll,
        createTemplate,
        updateTemplate: updateTemplateRecord,
        deleteTemplate,
        deleteCompliances,
        globalSearch,
        setGlobalSearch
    };

    return <ComplianceContext.Provider value={value as any}>{children}</ComplianceContext.Provider>;
}

export function useCompliance() {
    const context = useContext(ComplianceContext);
    if (context === undefined) {
        throw new Error("useCompliance must be used within a ComplianceProvider");
    }
    return context;
}
