// src/services/reportService.ts
import api from '@/lib/api';

export interface ReportStats {
    byRisk: { _id: string; count: number }[];
    byStage: { _id: string; count: number }[];
    byOrganization: { _id: string; name: string; count: number }[];
    byDepartment: { _id: string; count: number }[];
}

export interface HighRiskCompliance {
    _id: string;
    company: { _id: string; name: string };
    client: { _id: string; name: string };
    serviceType: string;
    expertName?: string;
    stage: string;
    status: string;
    dueDate: string;
    risk: string;
    isNew?: boolean; // Virtual/Frontend flag
}

export interface DashboardStats {
    summary: {
        totalRevenue: number;
        consultationRevenue: number;
        serviceEntityRevenue: number;
        directComplianceRevenue: number;
        newClientsThisMonth: number;
        paidConsultationsThisMonth: number;
        paidCompliancesThisMonth: number;
        totalTransactionsThisMonth: number;
    }
}

export const reportService = {
    /**
     * Get dashboard metrics for super-admin
     */
    async getDashboardStats(): Promise<{ summary: DashboardStats['summary']; message: string }> {
        const { data } = await api.get('/reports/dashboard-stats');
        return data;
    },

    /**
     * Get report overview statistics
     * Access: SUPER_ADMIN
     */
    async getOverview(companyId?: string): Promise<{ stats: ReportStats; message: string }> {
        const params = companyId ? { company: companyId } : {};
        const { data } = await api.get('/reports/overview', { params });
        return data;
    },

    /**
     * Get high risk compliances list
     * Access: SUPER_ADMIN
     */
    async getHighRiskCompliances(companyId?: string): Promise<{ compliances: HighRiskCompliance[]; message: string }> {
        const params = companyId ? { company: companyId } : {};
        const { data } = await api.get('/reports/high-risk', { params });
        return data;
    },
};
