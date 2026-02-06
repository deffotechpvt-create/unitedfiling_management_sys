import api from '../lib/api';
import type {
    Company,
    CompanyStats,
    CompanyFilters,
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
    async getStats(): Promise<CompanyStats> {
        const response = await api.get(`${this.baseUrl}/stats/overview`);
        return response.data.stats;
    }

    /**
     * Get all companies (role-based filtering)
     * Access: All roles
     * - SUPER_ADMIN: sees all companies
     * - ADMIN: sees companies of assigned clients
     * - USER: sees companies where they are members
     */
    async getAllCompanies(filters?: CompanyFilters): Promise<{ companies: Company[]; count: number }> {
        const params = new URLSearchParams();
        
        if (filters?.status) params.append('status', filters.status);
        if (filters?.client) params.append('client', filters.client);
        if (filters?.search) params.append('search', filters.search);

        const response = await api.get(`${this.baseUrl}?${params.toString()}`);
        return {
            companies: response.data.companies,
            count: response.data.count,
        };
    }

    /**
     * Get company by ID
     * Access: SUPER_ADMIN (all), ADMIN (assigned clients), USER (members only)
     */
    async getCompanyById(id: string): Promise<Company> {
        const response = await api.get(`${this.baseUrl}/${id}`);
        return response.data.company;
    }

    /**
     * Create new company
     * Access: All roles
     * - SUPER_ADMIN: any client
     * - ADMIN: only assigned clients
     * - USER: auto-added as OWNER
     */
    async createCompany(data: CreateCompanyData): Promise<Company> {
        const response = await api.post(this.baseUrl, data);
        return response.data.company;
    }

    /**
     * Update company
     * Access: SUPER_ADMIN (all + status), ADMIN (assigned clients), USER (OWNER only)
     */
    async updateCompany(id: string, data: UpdateCompanyData): Promise<Company> {
        const response = await api.put(`${this.baseUrl}/${id}`, data);
        return response.data.company;
    }

    /**
     * Delete company
     * Access: SUPER_ADMIN only
     */
    async deleteCompany(id: string): Promise<void> {
        await api.delete(`${this.baseUrl}/${id}`);
    }

    /**
     * Add member to company
     * Access: SUPER_ADMIN, ADMIN, USER (OWNER)
     */
    async addMember(companyId: string, data: AddMemberData): Promise<Company> {
        const response = await api.post(`${this.baseUrl}/${companyId}/members`, data);
        return response.data.company;
    }

    /**
     * Remove member from company
     * Access: SUPER_ADMIN, ADMIN, USER (OWNER)
     * Note: Cannot remove last OWNER
     */
    async removeMember(companyId: string, userId: string): Promise<Company> {
        const response = await api.delete(`${this.baseUrl}/${companyId}/members/${userId}`);
        return response.data.company;
    }

    /**
     * Update member role
     * Access: SUPER_ADMIN, ADMIN, USER (OWNER)
     * Note: Cannot downgrade last OWNER
     */
    async updateMemberRole(companyId: string, userId: string, data: UpdateMemberRoleData): Promise<Company> {
        const response = await api.patch(`${this.baseUrl}/${companyId}/members/${userId}/role`, data);
        return response.data.company;
    }
}

// Export singleton instance
const companyService = new CompanyService();
export default companyService;
