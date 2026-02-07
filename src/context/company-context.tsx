"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { Company, CompanyStats, CompanyFilters } from "@/types"
import companyService from "@/services/companyService"
import { toast } from "sonner" // or your toast library
import { useAuth } from "./auth-context" // Import your auth context

interface CompanyContextType {
    // State
    selectedCompany: Company | null
    companies: Company[]
    stats: CompanyStats | null
    loading: boolean
    error: string | null

    // Actions
    setSelectedCompany: (company: Company | null) => void
    fetchCompanies: (filters?: CompanyFilters) => Promise<void>
    fetchStats: () => Promise<void>
    createCompany: (data: any) => Promise<Company | null>
    updateCompany: (id: string, data: any) => Promise<Company | null>
    deleteCompany: (id: string) => Promise<boolean>
    addMember: (companyId: string, userId: string, role: 'OWNER' | 'EDITOR' | 'VIEWER') => Promise<boolean>
    removeMember: (companyId: string, userId: string) => Promise<boolean>
    updateMemberRole: (companyId: string, userId: string, role: 'OWNER' | 'EDITOR' | 'VIEWER') => Promise<boolean>
    refreshCompanies: () => Promise<void>
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth() // Get logged-in user

    const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(null)
    const [companies, setCompanies] = useState<Company[]>([])
    const [stats, setStats] = useState<CompanyStats | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    // Cache to prevent duplicate API calls
    const [lastFetchTime, setLastFetchTime] = useState<number>(0)
    const CACHE_DURATION = 30000 // 30 seconds

    // ========================================
    // Fetch Companies (Optimized with Cache)
    // ========================================
    const fetchCompanies = useCallback(async (filters?: CompanyFilters) => {
        // Prevent duplicate calls within cache duration
        const now = Date.now()
        if (!filters && now - lastFetchTime < CACHE_DURATION) {
            return // Use cached data
        }

        setLoading(true)
        setError(null)

        try {
            const { companies: fetchedCompanies } = await companyService.getAllCompanies(filters)
            setCompanies(fetchedCompanies)
            setLastFetchTime(now)

            // Auto-select first company if none selected
            if (!selectedCompany && fetchedCompanies.length > 0) {
                setSelectedCompanyState(fetchedCompanies[0])
            }

            // If selected company is in the list, update it with fresh data
            if (selectedCompany) {
                const updatedSelected = fetchedCompanies.find(c => c._id === selectedCompany._id)
                if (updatedSelected) {
                    setSelectedCompanyState(updatedSelected)
                }
            }
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || "Failed to fetch companies"
            setError(errorMsg)
            toast.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }, [selectedCompany, lastFetchTime])

    // ========================================
    // Fetch Stats (Only for SUPER_ADMIN/ADMIN)
    // ========================================
    const fetchStats = useCallback(async () => {
        if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
            return // Stats only for admins
        }

        try {
            const response = await companyService.getStats()
            setStats(response.stats)
        } catch (err: any) {
            console.error('Failed to fetch stats:', err)
            // Don't show error toast for stats (non-critical)
        }
    }, [user?.role])

    // ========================================
    // Create Company
    // ========================================
    const createCompany = useCallback(async (data: any): Promise<Company | null> => {
        setLoading(true)
        try {
            const response = await companyService.createCompany(data)

            // Add to local state (optimistic update)
            setCompanies(prev => [response.company, ...prev])

            // Auto-select newly created company
            setSelectedCompanyState(response.company)

            toast.success(response.message || "Company created successfully!")

            // Refresh stats
            fetchStats()

            return response.company
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || "Failed to create company"
            toast.error(errorMsg)
            return null
        } finally {
            setLoading(false)
        }
    }, [fetchStats])

    // ========================================
    // Update Company
    // ========================================
    const updateCompany = useCallback(async (id: string, data: any): Promise<Company | null> => {
        setLoading(true)
        try {
            const response = await companyService.updateCompany(id, data)

            // Update local state
            setCompanies(prev => prev.map(c => c._id === id ? response.company : c))

            // Update selected if it's the same company
            if (selectedCompany?._id === id) {
                setSelectedCompanyState(response.company)
            }

            toast.success(response.message || "Company updated successfully!")

            return response.company
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || "Failed to update company"
            toast.error(errorMsg)
            return null
        } finally {
            setLoading(false)
        }
    }, [selectedCompany])

    // ========================================
    // Delete Company
    // ========================================
    const deleteCompany = useCallback(async (id: string): Promise<boolean> => {
        setLoading(true)
        try {
            const response = await companyService.deleteCompany(id)

            // Remove from local state
            setCompanies(prev => prev.filter(c => c._id !== id))

            // Clear selection if deleted company was selected
            if (selectedCompany?._id === id) {
                setSelectedCompanyState(companies[0] || null)
            }

            toast.success(response.message || "Company deleted successfully!")

            // Refresh stats
            fetchStats()

            return true
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || "Failed to delete company"
            toast.error(errorMsg)
            return false
        } finally {
            setLoading(false)
        }
    }, [selectedCompany, companies, fetchStats])

    // ========================================
    // Add Member
    // ========================================
    const addMember = useCallback(async (companyId: string, userId: string, role: 'OWNER' | 'EDITOR' | 'VIEWER'): Promise<boolean> => {
        try {
            const response = await companyService.addMember(companyId, { userId, role })

            // Update local state
            setCompanies(prev => prev.map(c => c._id === companyId ? response.company : c))

            if (selectedCompany?._id === companyId) {
                setSelectedCompanyState(response.company)
            }

            toast.success(response.message || "Member added successfully!")
            return true
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || "Failed to add member"
            toast.error(errorMsg)
            return false
        }
    }, [selectedCompany])

    // ========================================
    // Remove Member
    // ========================================
    const removeMember = useCallback(async (companyId: string, userId: string): Promise<boolean> => {
        try {
            const response = await companyService.removeMember(companyId, userId)

            // Update local state
            setCompanies(prev => prev.map(c => c._id === companyId ? response.company : c))

            if (selectedCompany?._id === companyId) {
                setSelectedCompanyState(response.company)
            }

            toast.success(response.message || "Member removed successfully!")
            return true
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || "Failed to remove member"
            toast.error(errorMsg)
            return false
        }
    }, [selectedCompany])

    // ========================================
    // Update Member Role
    // ========================================
    const updateMemberRole = useCallback(async (companyId: string, userId: string, role: 'OWNER' | 'EDITOR' | 'VIEWER'): Promise<boolean> => {
        try {
            const response = await companyService.updateMemberRole(companyId, userId, { role })

            // Update local state
            setCompanies(prev => prev.map(c => c._id === companyId ? response.company : c))

            if (selectedCompany?._id === companyId) {
                setSelectedCompanyState(response.company)
            }

            toast.success(response.message || "Member role updated successfully!")
            return true
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message || "Failed to update member role"
            toast.error(errorMsg)
            return false
        }
    }, [selectedCompany])

    // ========================================
    // Manual Refresh
    // ========================================
    const refreshCompanies = useCallback(async () => {
        setLastFetchTime(0) // Clear cache
        await fetchCompanies()
    }, [fetchCompanies])

    // ========================================
    // Custom setSelectedCompany with validation
    // ========================================
    const setSelectedCompany = useCallback((company: Company | null) => {
        setSelectedCompanyState(company)
        // Optionally store in localStorage for persistence
        if (company) {
            localStorage.setItem('selectedCompanyId', company._id)
        } else {
            localStorage.removeItem('selectedCompanyId')
        }
    }, [])

    // ========================================
    // Initial Fetch (Only once on mount)
    // ========================================
    useEffect(() => {
        if (user) {
            fetchCompanies()
            fetchStats()
        }
    }, [user]) // Only run when user changes (login/logout)

    // ========================================
    // Restore selected company from localStorage
    // ========================================
    useEffect(() => {
        if (companies.length > 0) {
            const savedCompanyId = localStorage.getItem('selectedCompanyId')
            if (savedCompanyId) {
                const company = companies.find(c => c._id === savedCompanyId)
                if (company) {
                    setSelectedCompanyState(company)
                }
            }
        }
    }, [companies])

    return (
        <CompanyContext.Provider
            value={{
                selectedCompany,
                companies,
                stats,
                loading,
                error,
                setSelectedCompany,
                fetchCompanies,
                fetchStats,
                createCompany,
                updateCompany,
                deleteCompany,
                addMember,
                removeMember,
                updateMemberRole,
                refreshCompanies,
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
