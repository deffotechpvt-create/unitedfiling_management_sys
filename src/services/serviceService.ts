import api from "@/lib/api";

export interface Service {
    _id: string;
    id?: string;
    title: string;
    description: string;
    category: string;
    price: string;
    benefits: string[];
    processSteps: { title: string; description: string }[];
    createdAt: string;
    updatedAt: string;
}

const serviceService = {
    getAllServices: async () => {
        const { data } = await api.get("/services");
        return data.services.map((s: any) => ({
            ...s,
            id: s._id
        }));
    },

    getServiceById: async (id: string) => {
        const { data } = await api.get(`/services/${id}`);
        const service = data.service;
        return {
            ...service,
            id: service._id
        };
    }
};

export default serviceService;
