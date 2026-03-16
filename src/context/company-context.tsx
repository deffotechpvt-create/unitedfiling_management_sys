"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { Company, CompanyStats, CompanyFilters } from "@/types"
import companyService from "@/services/companyService"
import { toast } from "sonner"
import { useAuth } from "./auth-context"
import { ROLES } from "@/lib/roles"

interface CompanyContextType {
    selectedCompany: Company | null
    companies: Company[]
    stats: CompanyStats | null
    loading: boolean
    error: string | null
    filters: CompanyFilters
    setFilters: React.Dispatch<React.SetStateAction<CompanyFilters>>
    pagination: { page: number; limit: number; totalPages: number; totalCount: number }
    setPage: (page: number) => void
    setSelectedCompany: (company: Company | null) => void
    fetchCompanies: (force?: boolean, filters?: CompanyFilters) => Promise<void>
    fetchStats: (force?: boolean) => Promise<void>
    createCompany: (data: any) => Promise<Company | null>
    updateCompany: (id: string, data: any) => Promise<Company | null>
    deleteCompany: (id: string) => Promise<boolean>
    addMember: (companyId: string, userId: string, role: "OWNER" | "EDITOR" | "VIEWER") => Promise<boolean>
    removeMember: (companyId: string, userId: string) => Promise<boolean>
    updateMemberRole: (companyId: string, userId: string, role: "OWNER" | "EDITOR" | "VIEWER") => Promise<boolean>
    refreshAll: (force?: boolean) => Promise<void>
    getAddableUsers: (companyId: string) => Promise<any[]>
    exportAllCompanies: (filters?: CompanyFilters) => Promise<void>
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

const CACHE_DURATION = 30000; // 30 seconds

export function CompanyProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAuth()

    const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(null)
    const [companies, setCompanies] = useState<Company[]>([])
    const [stats, setStats] = useState<CompanyStats | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [filters, setFilters] = useState<CompanyFilters>({})
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalCount: 0 })

    const setPage = useCallback((page: number) => {
        setPagination(prev => ({ ...prev, page }))
    }, [])

    const lastFetchTime = useRef<{ companies: number; stats: number }>({ companies: 0, stats: 0 });
    const isFetching = useRef<{ companies: boolean; stats: boolean }>({ companies: false, stats: false });

    // ========================================
    // Fetch Companies (Optimized with Cache)
    // ========================================
    // ========================================
    const fetchCompanies = useCallback(async (force: boolean = false, customFilters?: CompanyFilters) => {
        const now = Date.now()
        const activeFilters = { ...pagination, ...filters, ...(customFilters || {}) };

        if (!force && !customFilters && now - lastFetchTime.current.companies < CACHE_DURATION && companies.length > 0) {
            return
        }

        if (isFetching.current.companies) return;
        isFetching.current.companies = true;

        if (companies.length === 0) setLoading(true)
        setError(null)

        try {
            const response = await companyService.getAllCompanies(activeFilters)
            setCompanies(response.companies)
            setPagination(prev => ({
                ...prev,
                totalPages: response.totalPages || 1,
                totalCount: response.count || 0
            }))
            lastFetchTime.current.companies = Date.now()

            // Logic to auto-select first company was removed here to honor 'All My Companies' as default.

            // Sync selected company if fresh data available
            setSelectedCompanyState(prev => {
                if (!prev) return prev;
                const updated = response.companies.find((c: Company) => c._id === prev._id);
                return updated || prev;
            });
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || "Failed to fetch companies"
            setError(errorMsg)
            if (force) toast.error(errorMsg)
        } finally {
            setLoading(false)
            isFetching.current.companies = false;
        }
    }, [filters, pagination.page, pagination.limit])

    // ========================================
    // Fetch Stats (Only for SUPER_ADMIN/ADMIN)
    // ========================================
    const fetchStats = useCallback(async (force: boolean = false) => {
        if (user?.role !== ROLES.SUPER_ADMIN && user?.role !== ROLES.ADMIN) {
            return
        }

        const now = Date.now();
        if (!force && now - lastFetchTime.current.stats < CACHE_DURATION && stats !== null) {
            return;
        }

        if (isFetching.current.stats) return;
        isFetching.current.stats = true;

        try {
            const response = await companyService.getStats()
            setStats(response.stats)
            lastFetchTime.current.stats = Date.now();
        } catch (err: any) {
            console.error('Failed to fetch stats:', err)
        } finally {
            isFetching.current.stats = false;
        }
    }, [user?.role])

    const refreshAll = useCallback(async (force: boolean = true) => {
        await Promise.all([
            fetchCompanies(force),
            fetchStats(force)
        ]);
    }, [fetchCompanies, fetchStats]);

    // ========================================
    // Mutations
    // ========================================
    const createCompany = useCallback(async (data: any): Promise<Company | null> => {
        try {
            const response = await companyService.createCompany(data)
            refreshAll(true)
            setSelectedCompanyState(response.company)
            toast.success("Company created")
            return response.company
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to create company")
            return null
        } finally {
            setLoading(false)
        }
    }, [refreshAll])

    const updateCompany = useCallback(async (id: string, data: any): Promise<Company | null> => {
        const previousCompanies = [...companies];
        setCompanies(prev => prev.map(c => c._id === id ? { ...c, ...data } as Company : c));

        try {
            const response = await companyService.updateCompany(id, data)
            setCompanies(prev => prev.map(c => c._id === id ? response.company : c))
            if (selectedCompany?._id === id) setSelectedCompanyState(response.company)
            toast.success("Company updated")
            return response.company
        } catch (err: any) {
            setCompanies(previousCompanies);
            toast.error(err?.response?.data?.message || "Failed to update company")
            return null
        }
    }, [selectedCompany, companies])

    const deleteCompany = useCallback(async (id: string): Promise<boolean> => {
        const previousCompanies = [...companies];
        setCompanies(prev => prev.filter(c => c._id !== id))
        if (selectedCompany?._id === id) setSelectedCompanyState(companies.find(c => c._id !== id) || null)

        try {
            await companyService.deleteCompany(id)
            toast.success("Company deleted")
            fetchStats(true)
            return true
        } catch (err: any) {
            setCompanies(previousCompanies);
            toast.error(err?.response?.data?.message || "Failed to delete company")
            return false
        }
    }, [selectedCompany, companies, fetchStats])

    const addMember = useCallback(async (companyId: string, userId: string, role: "OWNER" | "EDITOR" | "VIEWER"): Promise<boolean> => {
        try {
            const response = await companyService.addMember(companyId, { userId, role })
            setCompanies(prev => prev.map(c => c._id === companyId ? response.company : c))
            if (selectedCompany?._id === companyId) setSelectedCompanyState(response.company)
            toast.success("Member added")
            return true
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to add member")
            return false
        }
    }, [selectedCompany])

    const removeMember = useCallback(async (companyId: string, userId: string): Promise<boolean> => {
        try {
            const response = await companyService.removeMember(companyId, userId)
            setCompanies(prev => prev.map(c => c._id === companyId ? response.company : c))
            if (selectedCompany?._id === companyId) setSelectedCompanyState(response.company)
            toast.success("Member removed")
            return true
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to remove member")
            return false
        }
    }, [selectedCompany])

    const updateMemberRole = useCallback(async (companyId: string, userId: string, role: "OWNER" | "EDITOR" | "VIEWER"): Promise<boolean> => {
        try {
            const response = await companyService.updateMemberRole(companyId, userId, { role })
            setCompanies(prev => prev.map(c => c._id === companyId ? response.company : c))
            if (selectedCompany?._id === companyId) setSelectedCompanyState(response.company)
            toast.success("Role updated")
            return true
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to update member role")
            return false
        }
    }, [selectedCompany])

    const getAddableUsers = useCallback(async (companyId: string) => {
        // Double check permissions (USER role is read-only)
        if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
            return [];
        }
        
        try {
            const { users } = await companyService.getAddableUsers(companyId)
            return users
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to fetch addable users")
            return []
        }
    }, [user])

    const exportAllCompanies = useCallback(async (customFilters?: CompanyFilters) => {
        setLoading(true)
        try {
            const activeFilters = { ...filters, ...(customFilters || {}) }
            const blob = await companyService.exportCompanies(activeFilters)
            
            // Create download link
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `companies_export_${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            
            // Cleanup
            link.parentNode?.removeChild(link)
            window.URL.revokeObjectURL(url)
            
            toast.success("Companies exported successfully!")
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to export companies")
        } finally {
            setLoading(false)
        }
    }, [filters])

    const setSelectedCompany = useCallback((company: Company | null) => {
        setSelectedCompanyState(company)
        if (company) localStorage.setItem('selectedCompanyId', company._id)
        else localStorage.removeItem('selectedCompanyId')
    }, [])

    // Effects
    useEffect(() => {
        if (!isAuthenticated || !user) {
            setCompanies([])
            setStats(null)
            lastFetchTime.current = { companies: 0, stats: 0 }
            return
        }
        refreshAll(false)
    }, [user?._id, isAuthenticated, refreshAll])

    // Effect for handling filter changes
    useEffect(() => {
        if (isAuthenticated && user) {
            const timer = setTimeout(() => {
                refreshAll(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [filters, pagination.page, user?.role, isAuthenticated, refreshAll]);

    useEffect(() => {
        if (companies.length > 0) {
            const savedId = localStorage.getItem('selectedCompanyId')
            if (savedId) {
                const found = companies.find(c => c._id === savedId)
                if (found) setSelectedCompanyState(found)
            }
        }
    }, [companies.length])

    return (
        <CompanyContext.Provider
            value={{
                selectedCompany,
                companies,
                stats,
                loading,
                error,
                filters,
                setFilters,
                pagination,
                setPage,
                setSelectedCompany,
                fetchCompanies,
                fetchStats,
                createCompany,
                updateCompany,
                deleteCompany,
                addMember,
                removeMember,
                updateMemberRole,
                refreshAll,
                getAddableUsers,
                exportAllCompanies,
            }}
        >
            {children}
        </CompanyContext.Provider>
    )
}

export function useCompany() {
    const context = useContext(CompanyContext)
    if (context === undefined) {
        throw new Error("useCompany must be used within a CompanyProvider")
    }
    return context
}
