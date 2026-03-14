// services/authService.ts
import api from '@/lib/api';
import { LoginCredentials, RegisterData, AuthResponse, User } from '@/types';

export const authService = {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },

  // Register
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // Logout
  async logout(): Promise<AuthResponse> {
    const { data } = await api.post('/auth/logout');
    return data;
  },

  // Get current user
  async getMe(): Promise<{ success: boolean; user: User }> {
    const { data } = await api.get('/auth/me');
    return data;
  },

  // Update profile
  async updateProfile(userData: Partial<User>): Promise<{ success: boolean; user: User; message: string }> {
    const { data } = await api.put('/auth/profile', userData);
    return data;
  },

  // Forgot Password
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  // Reset Password
  async resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post(`/auth/reset-password/${token}`, { password });
    return data;
  },

  // Update onboarding task
  async updateOnboardingTask(task: string, completed: boolean = true): Promise<{ success: boolean; onboardingTasks: any }> {
    const { data } = await api.patch(`/auth/onboarding/${task}`, { completed });
    return data;
  },
};
