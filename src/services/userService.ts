// src/services/userService.ts
import api from '@/lib/api';
import { User } from '@/types';
import { get } from 'http';

export interface AdminWithUtilization {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    utilization: {
        clientCount: number;
        maxClients: number;
        availableSlots: number;
        isAtCapacity: boolean;
        totalPendingWork: number;
        totalCompletedWork: number;
    };
}

export interface CreateAdminData {
    name: string;
    email: string;
    password: string;
    phone?: string;
}

export interface UpdateUserStatusData {
    status: 'ACTIVE' | 'INACTIVE';
}
interface ServerStats {
    uptimeSeconds: number;
    uptimeFormatted: string;
    uptimePercentage: number;
    serverStartTime: string;
}
export const userService = {
    async getServerStats(): Promise<ServerStats> {
        const { data } = await api.get('/users/servers/stats');
        return data.serverData;

        // OR if your API returns { success: true, serverdata: {...} }
        // return data.serverdata;
    },

    // Get all admins with utilization
    async getAllAdmins(companyId?: string): Promise<{ admins: AdminWithUtilization[]; count: number; message: string }> {
        const params = companyId ? { company: companyId } : {};
        const { data } = await api.get('/users/admins', { params });
        return data;
    },

    // Create new admin
    async createAdmin(adminData: CreateAdminData): Promise<{ admin: User; message: string }> {
        const { data } = await api.post('/users/admins', adminData);
        return data;
    },

    // Get admin by ID
    async getAdminById(adminId: string): Promise<{ user: User }> {
        const { data } = await api.get(`/users/admins/${adminId}`);
        return data;
    },

    // Get admin utilization details
    async getAdminUtilization(adminId: string, companyId?: string): Promise<{
        admin: { id: string; name: string; email: string; status: string };
        clientCount: number;
        maxClients: number;
        availableSlots: number;
        isAtCapacity: boolean;
        utilizationPercentage: number;
        totalPendingWork: number;
        totalCompletedWork: number;
        clients: any[];
    }> {
        const params = companyId ? { company: companyId } : {};
        const { data } = await api.get(`/users/admins/${adminId}/utilization`, { params });
        return data;
    },

    // Update admin status
    async updateAdminStatus(
        adminId: string,
        statusData: UpdateUserStatusData
    ): Promise<{ user: User; message: string }> {
        const { data } = await api.patch(`/users/admins/${adminId}/status`, statusData);
        return data;
    },

    // Delete admin
    async deleteAdmin(adminId: string): Promise<{ message: string }> {
        const { data } = await api.delete(`/users/admins/${adminId}`);
        return data;
    },

    // Get all users (with optional filters)
    async getAllUsers(): Promise<{ users: User[]; count: number }> {
        const { data } = await api.get(`/users`);
        return data;
    },

    // Get user by ID
    async getUserById(userId: string): Promise<{ user: User }> {
        const { data } = await api.get(`/users/${userId}`);
        return data;
    },

    // Update user status
    async updateUserStatus(
        userId: string,
        statusData: UpdateUserStatusData
    ): Promise<{ user: User; message: string }> {
        const { data } = await api.patch(`/users/${userId}/status`, statusData);
        return data;
    },

    // Delete user
    async deleteUser(userId: string): Promise<{ message: string }> {
        const { data } = await api.delete(`/users/${userId}`);
        return data;
    },
};
