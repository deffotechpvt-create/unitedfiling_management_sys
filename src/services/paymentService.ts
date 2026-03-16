import api from '@/lib/api';

export interface PaymentOrderResponse {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
}

export interface VerifyPaymentData {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    entityId: string;
    entityType: 'CONSULTATION' | 'COMPLIANCE';
    consultationData?: any; // Only needed if creating a new consultation
}

export const paymentService = {
    /**
     * Create a Razorpay order from the backend
     */
    async createOrder(entityId: string, entityType: 'CONSULTATION' | 'COMPLIANCE'): Promise<PaymentOrderResponse> {
        const { data: response } = await api.post('/payments/create-order', { entityId, entityType });
        return response as any;
    },

    /**
     * Verify the payment signature and update entity status
     */
    async verifyPayment(data: VerifyPaymentData): Promise<{ message: string; entity: any }> {
        const { data: response } = await api.post(`/payments/verify-payment`, data);
        return response as any;
    }
};
