import api from "@/lib/api";

export interface ComplianceRecord {
    _id: string;
    id?: string;
    company: any;
    companyName: string;
    serviceType: string;
    expertName: string;
    dueDate: string;
    stage: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

const complianceService = {
    getAllCompliances: async (companyId?: string) => {
        const params = companyId ? { company: companyId } : {};
        const { data } = await api.get("/compliances", { params });
        return data.compliances.map((c: any) => ({
            ...c,
            id: c._id
        }));
    },

    getStats: async (companyId?: string) => {
        const params = companyId ? { company: companyId } : {};
        const { data } = await api.get("/compliances/stats", { params });
        return data.stats;
    }
};

export default complianceService;
