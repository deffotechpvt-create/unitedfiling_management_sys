import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OnboardingData = {
    usage: 'business' | 'personal' | null;
    personalInfo: {
        name: string;
    };
    designation: string;
    entityType: string;
    cinData: {
        cin: string;
        companyName: string;
        incorporationDate: Date | undefined;
        state: string;
        industry: string;
        isManual: boolean;
    };
    scale: {
        teamSize: string;
        turnover: string;
    };
};

type OnboardingStore = {
    currentStep: number;
    totalSteps: number;
    data: OnboardingData;
    hasOnboarded: boolean;
    setStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    updateData: (data: Partial<OnboardingData>) => void;
    reset: () => void;
    completeOnboarding: () => void;
};

const initialData: OnboardingData = {
    usage: null,
    personalInfo: { name: '' },
    designation: '',
    entityType: '',
    cinData: {
        cin: '',
        companyName: '',
        incorporationDate: undefined,
        state: '',
        industry: '',
        isManual: false,
    },
    scale: {
        teamSize: '',
        turnover: '',
    },
};

export const useOnboardingStore = create<OnboardingStore>()(
    persist(
        (set) => ({
            currentStep: 1,
            totalSteps: 6,
            data: initialData,
            hasOnboarded: false,
            setStep: (step) => set({ currentStep: step }),
            nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
            prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),
            updateData: (updates) =>
                set((state) => ({
                    data: { ...state.data, ...updates },
                })),
            reset: () => set({ currentStep: 1, data: initialData, hasOnboarded: false }),
            completeOnboarding: () => set({ hasOnboarded: true }),
        }),
        {
            name: 'onboarding-storage',
            partialize: (state) => ({ hasOnboarded: state.hasOnboarded, data: state.data }), // Only persist completion status and data
        }
    )
);
