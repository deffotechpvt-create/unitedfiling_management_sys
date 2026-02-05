// src/services/userService.ts
import api from '@/lib/api';
import { User } from '@/types';

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

export const userService = {
    // Get all admins with utilization
    async getAllAdmins(): Promise<{ admins: AdminWithUtilization[]; count: number }> {
        const { data } = await api.get('/users/admins');
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
    async getAdminUtilization(adminId: string): Promise<{
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
        const { data } = await api.get(`/users/admins/${adminId}/utilization`);
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
    async getAllUsers(filters?: { role?: string; status?: string }): Promise<{ users: User[]; count: number }> {
        const params = new URLSearchParams();
        if (filters?.role) params.append('role', filters.role);
        if (filters?.status) params.append('status', filters.status);

        const { data } = await api.get(`/users?${params.toString()}`);
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
