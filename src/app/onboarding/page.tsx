"use client";

import { useOnboardingStore } from '@/store/useOnboardingStore';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { StepUsageSelection } from '@/components/onboarding/StepUsageSelection';
import { StepPersonalInfo } from '@/components/onboarding/StepPersonalInfo';
import { StepDesignation } from '@/components/onboarding/StepDesignation';
import { StepEntity } from '@/components/onboarding/StepEntity';
import { StepCIN } from '@/components/onboarding/StepCIN';
import { StepScale } from '@/components/onboarding/StepScale';
import { LoadingAnalysis } from '@/components/onboarding/LoadingAnalysis';
import { useEffect } from 'react';
import { CalendarSidebarPreview } from '@/components/onboarding/CalendarSidebarPreview';

export default function OnboardingPage() {
    const { currentStep, nextStep } = useOnboardingStore();

    // Mapping steps to components
    // We treat LoadingAnalysis (Step 7) differently because it needs a custom sidebar.

    // Debug/Dev: Log current step
    useEffect(() => {
    }, [currentStep]);

    if (currentStep >= 7) {
        // Step 7 (Loading) and onwards (Success which is integrated)
        return (
            <OnboardingLayout sidebarContent={<CalendarSidebarPreview />}>
                <LoadingAnalysis onComplete={nextStep} />
            </OnboardingLayout>
        )
    }

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <StepUsageSelection />;
            case 2:
                return <StepPersonalInfo />;
            case 3:
                return <StepDesignation />;
            case 4:
                return <StepEntity />;
            case 5:
                return <StepCIN />;
            case 6:
                return <StepScale />;
            default:
                return <StepUsageSelection />;
        }
    };

    return (
        <OnboardingLayout>
            {renderStep()}
        </OnboardingLayout>
    );
}
