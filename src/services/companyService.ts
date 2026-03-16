import api from '../lib/api';
import type {
    Company,
    CompanyStats,
    CompanyFilters,
    User,
    CreateCompanyData,
    UpdateCompanyData,
    AddMemberData,
    UpdateMemberRoleData,
} from '@/types';

// ========================================
// Company Service
// ========================================

class CompanyService {
    private baseUrl = '/companies';

    /**
     * Get company statistics
     * Access: SUPER_ADMIN, ADMIN
     */
    async getStats(): Promise<{ stats: CompanyStats; message: string }> {
        const response = await api.get(`${this.baseUrl}/stats/overview`);
        return response.data;
    }

    /**
     * Get all companies (role-based filtering)
     * Access: All roles
     * - SUPER_ADMIN: sees all companies
     * - ADMIN: sees companies of assigned clients
     * - USER: sees companies where they are members
     */
    async getAllCompanies(filters?: CompanyFilters & { page?: number; limit?: number | 'all' }): Promise<{ companies: Company[]; count: number; totalPages: number; currentPage: number; message: string }> {
        const params = new URLSearchParams();

        if (filters?.status) params.append('status', filters.status);
        if (filters?.client) params.append('client', filters.client);
        if (filters?.search) params.append('search', filters.search);
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.limit) params.append('limit', String(filters.limit));

        const response = await api.get(`${this.baseUrl}?${params.toString()}`);
        return response.data;
    }

    /**
     * Get company by ID
     * Access: SUPER_ADMIN (all), ADMIN (assigned clients), USER (members only)
     */
    async getCompanyById(id: string): Promise<{ company: Company; message: string }> {
        const response = await api.get(`${this.baseUrl}/${id}`);
        return response.data;
    }

    /**
     * Create new company
     * Access: All roles
     * - SUPER_ADMIN: any client
     * - ADMIN: only assigned clients
     * - USER: auto-added as OWNER
     */
    async createCompany(data: CreateCompanyData): Promise<{ company: Company; message: string }> {
        const response = await api.post(this.baseUrl, data);
        return response.data;
    }

    /**
     * Update company
     * Access: SUPER_ADMIN (all + status), ADMIN (assigned clients), USER (OWNER only)
     */
    async updateCompany(id: string, data: UpdateCompanyData): Promise<{ company: Company; message: string }> {
        const response = await api.put(`${this.baseUrl}/${id}`, data);
        return response.data;
    }

    /**
     * Delete company
     * Access: SUPER_ADMIN only
     */
    async deleteCompany(id: string): Promise<{ message: string }> {
        const response = await api.delete(`${this.baseUrl}/${id}`);
        return response.data;
    }

    /**
     * Get users that can be added as company members
     * Access: SUPER_ADMIN, ADMIN
     */
    async getAddableUsers(companyId: string): Promise<{ users: User[]; message: string }> {
        const response = await api.get(`${this.baseUrl}/${companyId}/members/addable-users`);
        return response.data;
    }

    /**
     * Add member to company
     * Access: SUPER_ADMIN, ADMIN
     */
    async addMember(companyId: string, data: AddMemberData): Promise<{ company: Company; message: string }> {
        const response = await api.post(`${this.baseUrl}/${companyId}/members`, data);
        return response.data;
    }

    /**
     * Remove member from company
     * Access: SUPER_ADMIN, ADMIN
     * Note: Cannot remove last OWNER
     */
    async removeMember(companyId: string, userId: string): Promise<{ company: Company; message: string }> {
        const response = await api.delete(`${this.baseUrl}/${companyId}/members/${userId}`);
        return response.data;
    }

    async updateMemberRole(companyId: string, userId: string, data: UpdateMemberRoleData): Promise<{ company: Company; message: string }> {
        const response = await api.patch(`${this.baseUrl}/${companyId}/members/${userId}/role`, data);
        return response.data;
    }

    /**
     * Export companies to CSV
     * Access: SUPER_ADMIN, ADMIN
     */
    async exportCompanies(filters?: CompanyFilters): Promise<Blob> {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.client) params.append('client', filters.client);
        if (filters?.search) params.append('search', filters.search);

        const response = await api.get(`${this.baseUrl}/export?${params.toString()}`, {
            responseType: 'blob'
        });
        return response.data;
    }
}

// Export singleton instance
const companyService = new CompanyService();
export default companyService;
