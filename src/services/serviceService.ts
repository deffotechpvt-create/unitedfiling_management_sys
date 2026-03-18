import api from "@/lib/api";

export interface Service {
    _id: string;
    id?: string;
    title: string;
    description: string;
    category: string;
    serviceType: string;
    price: number;
    benefits: string[];
    processSteps?: { title: string; description: string }[];
    isActive?: boolean;
    createdAt: string;
    updatedAt: string;
}

const serviceService = {
    getAllServices: async (params: { page?: number; limit?: number } = {}) => {
        const { data } = await api.get("/services", { params });
        return {
            services: data.services.map((s: any) => ({
                ...s,
                id: s._id
            })),
            totalPages: data.totalPages,
            currentPage: data.currentPage,
            count: data.count
        };
    },

    getServiceById: async (id: string) => {
        const { data } = await api.get(`/services/${id}`);
        const service = data.service;
        return {
            ...service,
            id: service._id
        };
    },

    createService: async (serviceData: Partial<Service>) => {
        const { data } = await api.post("/services", serviceData);
        return data.service;
    },

    updateService: async (id: string, serviceData: Partial<Service>) => {
        const { data } = await api.put(`/services/${id}`, serviceData);
        return data.service;
    },

    deleteService: async (id: string) => {
        const { data } = await api.delete(`/services/${id}`);
        return data.message;
    }
};

export default serviceService;
