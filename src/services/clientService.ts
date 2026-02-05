// src/services/clientService.ts
import api from '@/lib/api';

export interface Client {
    _id: string;
    name: string;
    companyName: string;
    email?: string;
    phone?: string;
    status: 'ACTIVE' | 'INACTIVE';
    assignedAdmin?: {
        _id: string;
        name: string;
        email: string;
    } | null;
    userId?: {
        _id: string;
        name: string;
        email: string;
    };
    pendingWork: number;
    completedWork: number;
    totalWork?: number;
    completionRate?: number;
    isAssigned?: boolean;
    joinedDate: string;
    createdAt: string;
    updatedAt: string;
}

export interface ClientStats {
    totalClients: number;
    activeClients: number;
    inactiveClients: number;
    unassignedClients: number;
    totalPendingWork: number;
    totalCompletedWork: number;
    totalWork: number;
}

export interface CreateClientData {
    name: string;
    companyName: string;
    email?: string;
    phone?: string;
    assignedAdmin?: string;
}

export interface UpdateClientData {
    name?: string;
    companyName?: string;
    email?: string;
    phone?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    assignedAdmin?: string;
}

export interface ClientFilters {
    status?: 'ACTIVE' | 'INACTIVE';
    assignedAdmin?: string | 'unassigned';
    search?: string;
}

export const clientService = {
    // Get all clients with optional filters
    async getAllClients(filters?: ClientFilters): Promise<{ clients: Client[]; message: string }> {
        const params = new URLSearchParams();
        
        if (filters?.status) params.append('status', filters.status);
        if (filters?.assignedAdmin) params.append('assignedAdmin', filters.assignedAdmin);
        if (filters?.search) params.append('search', filters.search);

        const queryString = params.toString();
        const url = `/clients${queryString ? `?${queryString}` : ''}`;
        
        const { data } = await api.get(url);
        return data;
    },

    // Get client by ID
    async getClientById(clientId: string): Promise<{ client: Client; message: string }> {
        const { data } = await api.get(`/clients/${clientId}`);
        return data;
    },

    // Create new client
    async createClient(clientData: CreateClientData): Promise<{ client: Client; message: string }> {
        const { data } = await api.post('/clients', clientData);
        return data;
    },

    // Update client
    async updateClient(clientId: string, updateData: UpdateClientData): Promise<{ client: Client; message: string }> {
        const { data } = await api.put(`/clients/${clientId}`, updateData);
        return data;
    },

    // Delete client (SUPER_ADMIN only)
    async deleteClient(clientId: string): Promise<{ message: string }> {
        const { data } = await api.delete(`/clients/${clientId}`);
        return data;
    },

    // Assign client to admin (SUPER_ADMIN only)
    async assignClientToAdmin(clientId: string, adminId: string): Promise<{ client: Client; message: string }> {
        const { data } = await api.post(`/clients/${clientId}/assign`, { adminId });
        return data;
    },

    // Unassign client from admin (SUPER_ADMIN only)
    async unassignClient(clientId: string): Promise<{ client: Client; message: string }> {
        const { data } = await api.post(`/clients/${clientId}/unassign`);
        return data;
    },

    // Get unassigned clients (SUPER_ADMIN only)
    async getUnassignedClients(): Promise<{ clients: Client[]; count: number; message: string }> {
        const { data } = await api.get('/clients/unassigned/list');
        return data;
    },

    // Get client statistics
    async getClientStats(): Promise<{ stats: ClientStats; message: string }> {
        const { data } = await api.get('/clients/stats/overview');
        return data;
    },
};
