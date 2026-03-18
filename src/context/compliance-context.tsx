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
    fetchCompliances: (companyId?: string, force?: boolean, filters?: { department?: string; category?: string | string[]; search?: string; assignedTo?: string; page?: number; limit?: number }) => Promise<void>;
    fetchStats: (companyId?: string, force?: boolean, filters?: { department?: string; category?: string | string[]; search?: string; assignedTo?: string }) => Promise<void>;
    fetchTemplates: (force?: boolean) => Promise<void>;
    updateCompliance: (id: string, data: UpdateComplianceData) => Promise<void>;
    addAttachment: (id: string, url: string, name?: string, note?: string) => Promise<void>;
    fetchAdminsForAssignment: (force?: boolean) => Promise<void>;
    refreshAll: (companyId?: string, force?: boolean, filters?: { department?: string; category?: string | string[]; search?: string; assignedTo?: string; page?: number; limit?: number }) => Promise<void>;
    createTemplate: (data: any) => Promise<void>;
    updateTemplate: (id: string, data: any) => Promise<void>;
    deleteTemplate: (id: string) => Promise<void>;
    deleteCompliances: (ids: string[]) => Promise<void>;
    exportAllCompliances: (filters?: any) => Promise<void>;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalDocs: number;
    };
    setPage: (page: number) => void;
    filters: {
        department: string | null;
        category: string[];
        search: string;
        assignedTo: string;
        tab: string;
    };
    setFilters: (filters: Partial<ComplianceContextType['filters']>) => void;
    // For backward compatibility
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
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalDocs: 0 });
    const [filters, setFiltersState] = useState({
        department: null as string | null,
        category: [] as string[],
        search: "",
        assignedTo: "all",
        tab: "All"
    });
    const { user, isAuthenticated } = useAuth();
    const { selectedCompany, loading: companyLoading } = useCompany();

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

    const fetchCompliances = useCallback(async (companyId?: string, force: boolean = false, filters: { department?: string; category?: string | string[]; search?: string; assignedTo?: string; page?: number; limit?: number } = {}) => {
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

        // Only show global loading on first fetch
        if (!lastFetchTime.current.compliances) {
            setLoading(true);
        }
        setError(null);
        try {
            const response = await complianceService.getCompliances({ company: companyId, ...filters });
            setCompliances(response.compliances);
            setPagination({
                currentPage: response.currentPage || 1,
                totalPages: response.totalPages || 1,
                totalDocs: response.totalDocs || 0
            });
            lastFetchTime.current.compliances = Date.now();
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to fetch compliances";
            setError(msg);
            if (force) toast.error(msg);
        } finally {
            setLoading(false);
            isFetching.current.compliances = false;
        }
    }, []); // Stable fetcher

    const fetchStats = useCallback(async (companyId?: string, force: boolean = false, filters: { department?: string; category?: string | string[]; search?: string; assignedTo?: string } = {}) => {
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
        const previousCompliances = [...compliances];
        const previousStats = stats ? { ...stats } : null;

        // Optimistic UI update
        setCompliances(prev => prev.map(c => c._id === id ? { ...c, ...data } as Compliance : c));

        try {
            await complianceService.updateCompliance(id, data);
            window.dispatchEvent(new CustomEvent('app:sync-compliance'));
            // Refetch quietly in background to ensure stats and data are synced
            fetchStats(lastCompanyId.current, true);
        } catch (err: any) {
            setCompliances(previousCompliances);
            setStats(previousStats);
            toast.error(err.response?.data?.message || "Failed to update compliance");
        }
    };

    const addAttachment = async (id: string, url: string, name?: string, note?: string) => {
        const previousCompliances = [...compliances];
        const previousStats = stats ? { ...stats } : null;

        // Optimistic UI update
        setCompliances(prev => prev.map(c => {
            if (c._id === id) {
                const newAttachments = [...(c.attachments || []), { name, url }];
                let newStatus = c.status;
                let newStage = c.stage;

                // Mirror backend logic for auto-progression
                if (newStatus === 'PENDING' || newStatus === 'WAITING_FOR_CLIENT' || newStatus === 'NEEDS_ACTION') {
                    newStatus = 'IN_PROGRESS';
                }
                if (newStage === 'PAYMENT') {
                    newStage = 'DOCUMENTATION';
                }

                return { ...c, attachments: newAttachments, status: newStatus, stage: newStage } as Compliance;
            }
            return c;
        }));

        try {
            await complianceService.addAttachment(id, url, name, note);
            window.dispatchEvent(new CustomEvent('app:sync-compliance'));
            toast.success("Attachment added");
            // Background refresh to get server-verified state
            fetchStats(lastCompanyId.current, true);
        } catch (err: any) {
            setCompliances(previousCompliances);
            setStats(previousStats);
            toast.error(err.response?.data?.message || "Failed to add attachment");
        }
    };

    const refreshAll = useCallback(async (companyId?: string, force: boolean = false, overrideFilters: any = null) => {
        const activeFilters = overrideFilters || {
            department: filters.department,
            category: filters.category,
            search: filters.search,
            assignedTo: filters.assignedTo,
            tab: filters.tab,
            page: pagination.currentPage,
            limit: 5
        };

        await Promise.all([
            fetchCompliances(companyId, force, activeFilters),
            fetchStats(companyId, force, activeFilters),
        ]);
    }, [fetchCompliances, fetchStats, filters, pagination.currentPage]);

    // Handle auto-refresh when filters or pagination change
    useEffect(() => {
        if (!isAuthenticated || !user || companyLoading) return;

        refreshAll(selectedCompany?._id, false);
    }, [
        isAuthenticated,
        user?._id,
        selectedCompany?._id,
        companyLoading,
        filters.department,
        filters.category,
        filters.search,
        filters.assignedTo,
        filters.tab,
        pagination.currentPage,
        refreshAll
    ]);

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

    useEffect(() => {
        const handleSync = (e: any) => {
            if (!isAuthenticated) return;
            // Listen for specific compliance sync OR global sync
            if (e.type === 'app:sync-compliance' || e.type === 'app:sync-data') {
                console.log(`[Compliance] 🔄 Syncing data from broadcast (${e.type})...`);
                refreshAll(lastCompanyId.current, true);
            }
        };
        window.addEventListener('app:sync-data', handleSync);
        window.addEventListener('app:sync-compliance', handleSync);
        return () => {
            window.removeEventListener('app:sync-data', handleSync);
            window.removeEventListener('app:sync-compliance', handleSync);
        };
    }, [isAuthenticated, refreshAll]);

    const createTemplate = async (data: any) => {
        const previousTemplates = [...templates];
        // Optimistic update with temp ID
        const tempId = `temp-${Date.now()}`;
        setTemplates(prev => [{ ...data, _id: tempId }, ...prev]);

        try {
            await complianceService.createTemplate(data);
            toast.success("Template created");
            fetchTemplates(true);
        } catch (err: any) {
            setTemplates(previousTemplates);
            toast.error(err.response?.data?.message || "Failed to create template");
        }
    };

    const updateTemplateRecord = async (id: string, data: any) => {
        const previousTemplates = [...templates];
        setTemplates(prev => prev.map(t => t._id === id ? { ...t, ...data } : t));

        try {
            await complianceService.updateTemplate(id, data);
            toast.success("Template updated");
        } catch (err: any) {
            setTemplates(previousTemplates);
            toast.error(err.response?.data?.message || "Failed to update template");
        }
    };

    const deleteTemplate = async (id: string) => {
        const previousTemplates = [...templates];
        setTemplates(prev => prev.filter(t => t._id !== id));

        try {
            await complianceService.deleteTemplate(id);
            toast.success("Template deleted");
        } catch (err: any) {
            setTemplates(previousTemplates);
            toast.error(err.response?.data?.message || "Failed to delete template");
        }
    };

    const deleteCompliances = useCallback(async (ids: string[]) => {
        const previousCompliances = [...compliances];
        setCompliances(prev => prev.filter(c => !ids.includes(c._id)));

        try {
            await complianceService.deleteCompliances(ids);
            window.dispatchEvent(new CustomEvent('app:sync-compliance'));
            toast.success("Deleted successfully");
            refreshAll(lastCompanyId.current, true);
        } catch (err: any) {
            setCompliances(previousCompliances);
            toast.error(err.response?.data?.message || "Failed to delete compliances");
        }
    }, [compliances, refreshAll]);

    const exportAllCompliances = async (filters: any = {}) => {
        // We don't set global loading here to keep UI clean, button should handle its own state if needed
        try {
            const companyId = lastCompanyId.current;
            const blob = await complianceService.exportCompliances({ company: companyId, ...filters });

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `compliances_export_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.csv`);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success("Compliance data exported successfully");
        } catch (err: any) {
            toast.error("Failed to export compliances");
        }
    };

    const setPage = useCallback((page: number) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    }, []);

    const setFilters = useCallback((newFilters: Partial<ComplianceContextType['filters']>) => {
        setFiltersState(prev => ({ ...prev, ...newFilters }));
        // Reset to page 1 on filter change
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    const setGlobalSearch = useCallback((search: string) => {
        setFiltersState(prev => ({ ...prev, search }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    const value = React.useMemo(() => ({
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
        exportAllCompliances,
        pagination,
        setPage,
        filters,
        setFilters,
        globalSearch: filters.search,
        setGlobalSearch
    }), [
        compliances, stats, admins, templates, loading, error,
        fetchCompliances, fetchStats, fetchTemplates,
        updateCompliance, addAttachment, fetchAdminsForAssignment,
        refreshAll, createTemplate, updateTemplateRecord,
        deleteTemplate, deleteCompliances, exportAllCompliances,
        pagination, setPage, filters, setFilters, setGlobalSearch
    ]);

    return <ComplianceContext.Provider value={value}>{children}</ComplianceContext.Provider>;
}

export function useCompliance() {
    const context = useContext(ComplianceContext);
    if (context === undefined) {
        throw new Error("useCompliance must be used within a ComplianceProvider");
    }
    return context;
}
