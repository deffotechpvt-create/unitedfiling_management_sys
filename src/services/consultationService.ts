// src/services/consultationService.ts
import api from '@/lib/api';

export interface Message {
    sender: 'User' | 'Expert';
    content: string;
    timestamp: string;
}

export interface Consultation {
    _id: string;
    ticketNumber: string;
    user: string | { _id: string; name: string; email: string };
    type: string;
    status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    payment?: {
        orderId: string;
        paymentId: string;
        amount: number;
        currency: string;
        status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
        paidAt: string;
    };
    scheduledSlot?: {
        date: string;
        time: string;
    };
    assignedExpert?: {
        _id: string;
        name: string;
        email: string;
    };
    notes?: string;
    messages: Message[];
    createdAt: string;
}

export interface BookConsultationData {
    type: string;
    date?: string;
    time?: string;
    notes?: string;
}

export const consultationService = {
    // Create Razorpay Order
    async createOrder(amount: number = 1000): Promise<{ orderId: string; amount: number; currency: string; keyId: string; message?: string }> {
        const { data: response } = await api.post('/payments/create-order', { amount, entityType: 'CONSULTATION' });
        return response as any;
    },

    // Verify Payment & Book
    async verifyPayment(data: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
        consultationData: BookConsultationData;
    }): Promise<{ consultation: Consultation; message: string }> {
        const { data: response } = await api.post(`/payments/verify-payment`, {
            ...data,
            entityType: 'CONSULTATION'
        });
        return response as any;
    },

    // Refund Payment (Super Admin)
    async refundPayment(id: string): Promise<{ consultation: Consultation; message: string }> {
        const { data: response } = await api.post(`/consultations/${id}/refund`);
        return response;
    },

    // Get current user's consultations
    async getMyConsultations(params?: { page?: number; limit?: number }): Promise<{ consultations: Consultation[]; pagination?: { totalCount: number; totalPages: number; currentPage: number; limit: number }; message: string }> {
        const { data: response } = await api.get('/consultations', { params });
        return response;
    },

    // Get consultation by ID
    async getConsultationById(id: string): Promise<{ consultation: Consultation; message: string }> {
        const { data: response } = await api.get(`/consultations/${id}`);
        return response;
    },

    // Add message
    async addMessage(id: string, content: string): Promise<{ messages: Message[]; message: string }> {
        const { data: response } = await api.post(`/consultations/${id}/messages`, { content });
        return response;
    },

    // Assign expert (Admin)
    async assignExpert(id: string, expertId: string): Promise<{ consultation: Consultation; message: string }> {
        const { data: response } = await api.patch(`/consultations/${id}/assign`, { expertId });
        return response;
    },

    // Update status (Admin)
    async updateStatus(id: string, status: string): Promise<{ consultation: Consultation; message: string }> {
        const { data: response } = await api.patch(`/consultations/${id}/status`, { status });
        return response;
    },
};
