"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { consultationService, Consultation, BookConsultationData } from "@/services/consultationService";
import { userService } from "@/services/userService";
import { toast } from "sonner";
import { useAuth } from "./auth-context";
import { isSuperAdmin } from "@/lib/roles";

interface ConsultationContextType {
    consultations: Consultation[];
    currentConsultation: Consultation | null;
    admins: { _id: string; name: string }[];
    loading: boolean;
    error: string | null;
    pagination: { page: number; limit: number; totalPages: number; totalCount: number };
    setPage: (page: number) => void;
    fetchMyConsultations: (force?: boolean) => Promise<void>;
    fetchConsultationById: (id: string, force?: boolean) => Promise<void>;
    fetchAdminsForAssignment: (force?: boolean) => Promise<void>;
    createPaymentOrder: (amount?: number) => Promise<{ orderId: string; amount: number; currency: string; keyId: string } | null>;
    verifyPaymentAndBook: (paymentData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }, consultationData: BookConsultationData) => Promise<boolean>;
    refundConsultation: (id: string) => Promise<void>;
    sendConsultationMessage: (id: string, content: string) => Promise<void>;
    assignExpert: (id: string, expertId: string) => Promise<void>;
    updateConsultationStatus: (id: string, status: string) => Promise<void>;
    setCurrentConsultation: (consultation: Consultation | null) => void;
    refreshAll: (force?: boolean) => Promise<void>;
}

const ConsultationContext = createContext<ConsultationContextType | undefined>(undefined);

const CACHE_DURATION = 60000; // 1 minute for consultations

export function ConsultationProvider({ children }: { children: React.ReactNode }) {
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [currentConsultation, setCurrentConsultation] = useState<Consultation | null>(null);
    const [admins, setAdmins] = useState<{ _id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user, isAuthenticated } = useAuth();
    const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalCount: 0 });

    const setPage = (page: number) => {
        setPagination(prev => ({ ...prev, page }));
    };
    
    const lastFetchTime = useRef<{ consultations: number; admins: number }>({ consultations: 0, admins: 0 });
    const isFetching = useRef<{ consultations: boolean; admins: boolean }>({ consultations: false, admins: false });

    const fetchMyConsultations = useCallback(async (force: boolean = false) => {
        const now = Date.now();
        if (!force && now - lastFetchTime.current.consultations < CACHE_DURATION && consultations.length > 0) {
            return;
        }

        if (isFetching.current.consultations) return;
        isFetching.current.consultations = true;

        if (consultations.length === 0) setLoading(true);
        setError(null);
        try {
            const response = await consultationService.getMyConsultations({ 
                page: pagination.page, 
                limit: pagination.limit 
            });
            setConsultations(response.consultations);
            if (response.pagination) {
                setPagination(prev => ({
                    ...prev,
                    totalPages: response.pagination!.totalPages,
                    totalCount: response.pagination!.totalCount
                }));
            }
            lastFetchTime.current.consultations = Date.now();
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to fetch consultations";
            setError(msg);
            if (force) toast.error(msg);
        } finally {
            setLoading(false);
            isFetching.current.consultations = false;
        }
    }, [consultations.length]);

    const fetchAdminsForAssignment = useCallback(async (force: boolean = false) => {
        if (!isSuperAdmin(user?.role)) return;

        const now = Date.now();
        if (!force && now - lastFetchTime.current.admins < CACHE_DURATION && admins.length > 0) {
            return;
        }

        if (isFetching.current.admins) return;
        isFetching.current.admins = true;

        try {
            const response = await userService.getAdminsForAssignment();
            setAdmins(response.admins as any);
            lastFetchTime.current.admins = Date.now();
        } catch (err: any) {
            console.error("Failed to fetch admins for assignment", err);
        } finally {
            isFetching.current.admins = false;
        }
    }, [user?.role, admins.length]);

    const fetchConsultationById = useCallback(async (id: string, force: boolean = false) => {
        // If we already have this consultation and it's recent, skip (optional for single items)
        if (!force && currentConsultation?._id === id) {
            return;
        }

        setLoading(true);
        try {
            const response = await consultationService.getConsultationById(id);
            setCurrentConsultation(response.consultation);
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to fetch consultation details";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }, [currentConsultation?._id]);

    const createPaymentOrder = async (amount: number = 1000) => {
        setLoading(true);
        try {
            const response = await consultationService.createOrder(amount);
            return {
                orderId: response.orderId,
                amount: response.amount,
                currency: response.currency,
                keyId: response.keyId
            };
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to initiate payment";
            toast.error(msg);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const verifyPaymentAndBook = async (
        paymentData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string },
        consultationData: BookConsultationData
    ) => {
        setLoading(true);
        try {
            await consultationService.verifyPayment({
                ...paymentData,
                consultationData
            });
            // ✅ Sync across all modules
            window.dispatchEvent(new CustomEvent('app:sync-consultation'));
            toast.success("Consultation booked & payment successful!");
            fetchMyConsultations(true);
            return true;
        } catch (err: any) {
            const msg = err.response?.data?.message || "Payment verification failed";
            toast.error(msg);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const refundConsultation = async (id: string) => {
        setLoading(true);
        try {
            await consultationService.refundPayment(id);
            toast.success("Payment refunded successfully");
            fetchMyConsultations(true);
            if (currentConsultation?._id === id) fetchConsultationById(id, true);
        } catch (err: any) {
            const msg = err.response?.data?.message || "Failed to refund payment";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const sendConsultationMessage = async (id: string, content: string) => {
        try {
            const response = await consultationService.addMessage(id, content);
            if (currentConsultation && currentConsultation._id === id) {
                setCurrentConsultation({ ...currentConsultation, messages: response.messages });
            }
        } catch (err: any) {
            toast.error("Failed to send message");
        }
    };

    const assignExpert = async (id: string, expertId: string) => {
        const previousConsultations = [...consultations];
        const expert = admins.find(a => a._id === expertId);
        
        setConsultations(prev => prev.map(c => 
            c._id === id ? { ...c, assignedExpert: expertId, expertName: expert?.name } as any : c
        ));

        try {
            await consultationService.assignExpert(id, expertId);
            window.dispatchEvent(new CustomEvent('app:sync-consultation'));
            toast.success("Expert assigned");
            fetchMyConsultations(true);
        } catch (err: any) {
            setConsultations(previousConsultations);
            toast.error("Failed to assign expert");
        }
    };

    const updateConsultationStatus = async (id: string, status: string) => {
        const previousConsultations = [...consultations];
        setConsultations(prev => prev.map(c => c._id === id ? { ...c, status } as any : c));

        try {
            await consultationService.updateStatus(id, status);
            window.dispatchEvent(new CustomEvent('app:sync-consultation'));
            toast.success("Status updated");
            fetchMyConsultations(true);
        } catch (err: any) {
            setConsultations(previousConsultations);
            toast.error("Failed to update status");
        }
    };

    const refreshAll = useCallback(async (force: boolean = false) => {
        await Promise.all([
            fetchMyConsultations(force),
            fetchAdminsForAssignment(force)
        ]);
    }, [fetchMyConsultations, fetchAdminsForAssignment]);

    // Centralized Effect
    useEffect(() => {
        if (!isAuthenticated || !user) {
            setConsultations([]);
            setCurrentConsultation(null);
            setAdmins([]);
            lastFetchTime.current = { consultations: 0, admins: 0 };
            return;
        }

        refreshAll(false);
    }, [user?._id, isAuthenticated, refreshAll, pagination.page]);

    useEffect(() => {
        const handleSync = (e: any) => {
            if (!isAuthenticated) return;
            if (e.type === 'app:sync-consultation' || e.type === 'app:sync-data') {
                console.log(`[Consultation] 🔄 Syncing data from broadcast (${e.type})...`);
                refreshAll(true);
            }
        };
        window.addEventListener('app:sync-data', handleSync);
        window.addEventListener('app:sync-consultation', handleSync);
        return () => {
            window.removeEventListener('app:sync-data', handleSync);
            window.removeEventListener('app:sync-consultation', handleSync);
        };
    }, [isAuthenticated, refreshAll]);

    return (
        <ConsultationContext.Provider
            value={{
                consultations,
                currentConsultation,
                admins,
                loading,
                error,
                fetchMyConsultations,
                fetchConsultationById,
                fetchAdminsForAssignment,
                createPaymentOrder,
                verifyPaymentAndBook,
                refundConsultation,
                sendConsultationMessage,
                assignExpert,
                updateConsultationStatus,
                setCurrentConsultation,
                refreshAll,
                pagination,
                setPage
            }}
        >
            {children}
        </ConsultationContext.Provider>
    );
}

export function useConsultation() {
    const context = useContext(ConsultationContext);
    if (context === undefined) {
        throw new Error("useConsultation must be used within a ConsultationProvider");
    }
    return context;
}
