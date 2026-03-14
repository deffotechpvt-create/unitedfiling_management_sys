import api from "@/lib/api";

export interface Compliance {
    _id: string;
    id?: string;
    company: any;
    companyName: string;
    serviceType: string;
    category?: string;
    expertName: string;
    dueDate: string;
    stage: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    assignedTo?: string | { _id: string; name: string } | null;
}

export interface ComplianceStats {
    total: number;
    pending: number;
    needsAction: number;
    inProgress: number;
    waitingForClient: number;
    completed: number;
    delayed: number;
    overdue: number;
    upcoming: number;
}

export interface ComplianceTemplate {
    _id: string;
    serviceType: string;
    category?: string;
    department: string;
    frequency: string;
    daysUntilDue: number;
    isMandatory: boolean;
    risk: string;
    description: string;
}

export interface UpdateComplianceData {
    status?: string;
    stage?: string;
    assignedTo?: string | null;
    expertName?: string;
    note?: string;
    url?: string;
}

export const complianceService = {
    getCompliances: async (filters: { company?: string; department?: string; category?: string | string[]; search?: string } = {}): Promise<{ compliances: Compliance[] }> => {
        const { data } = await api.get("/compliances", { params: filters });
        return {
            compliances: data.compliances.map((c: any) => ({
                ...c,
                id: c._id
            }))
        };
    },

    getComplianceStats: async (filters: { company?: string; department?: string; category?: string | string[]; search?: string } = {}): Promise<{ stats: ComplianceStats }> => {
        const { data } = await api.get("/compliances/stats", { params: filters });
        return { stats: data.stats };
    },

    updateCompliance: async (id: string, data: UpdateComplianceData): Promise<{ compliance: Compliance }> => {
        const { data: response } = await api.patch(`/compliances/${id}`, data);
        return { compliance: response.compliance };
    },

    createCompliance: async (data: any): Promise<{ compliance: Compliance }> => {
        const { data: response } = await api.post("/compliances", data);
        return { compliance: response.compliance };
    },

    getTemplates: async (): Promise<{ templates: ComplianceTemplate[] }> => {
        const { data } = await api.get("/compliances/templates");
        return { templates: data.templates };
    },

    createTemplate: async (data: any): Promise<{ template: ComplianceTemplate }> => {
        const { data: response } = await api.post("/compliances/templates", data);
        return { template: response.template };
    },

    updateTemplate: async (id: string, data: any): Promise<{ template: ComplianceTemplate }> => {
        const { data: response } = await api.put(`/compliances/templates/${id}`, data);
        return { template: response.template };
    },

    deleteTemplate: async (id: string): Promise<any> => {
        const { data } = await api.delete(`/compliances/templates/${id}`);
        return data;
    },

    addAttachment: async (id: string, url: string, note?: string): Promise<any> => {
        const { data } = await api.patch(`/compliances/${id}/attachments`, { url, note });
        return data;
    },
    deleteCompliances: async (ids: string[]): Promise<any> => {
        const { data } = await api.delete("/compliances/bulk", { data: { ids } });
        return data;
    }
};

export default complianceService;
