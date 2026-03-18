'use client';

import { cn } from '@/lib/utils';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, PlayCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';


export function LoadingAnalysis({ onComplete }: { onComplete?: () => void }) { 

    const [progress, setProgress] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [isFinished, setIsFinished] = useState(false);
    const [complianceCount, setComplianceCount] = useState(0);
    const router = useRouter();
    const { completeOnboarding } = useAuth();
    const { data: onboardingData } = useOnboardingStore();


    const steps = [
        "Creating organization details for you.",
        "Fetching compliances for your industry.",
        "Filtering compliances based on your location.",
        "You are almost done! Migrating compliances."
    ];

    useEffect(() => {
        // Simulate progress
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(timer);
                    return 100;
                }
                // Vary speed: fast start, slow middle, fast end
                let increment = 1;
                if (prev < 30) increment = 2;
                else if (prev < 70) increment = 0.5; // slow down for "Fetching" realism
                else increment = 2; // speed up

                return Math.min(prev + increment, 100);
            });
        }, 50);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        // Simulate checklist completion based on progress
        if (progress > 15 && !completedSteps.includes(0)) setCompletedSteps(prev => [...prev, 0]);
        if (progress > 45 && !completedSteps.includes(1)) setCompletedSteps(prev => [...prev, 1]);
        if (progress > 80 && !completedSteps.includes(2)) setCompletedSteps(prev => [...prev, 2]);
        if (progress === 100 && !completedSteps.includes(3)) {
            setCompletedSteps(prev => [...prev, 3]);
            setTimeout(() => {
                setIsFinished(true);
            }, 500);
        }
    }, [progress, completedSteps]);

    // Counter Animation when finished
    useEffect(() => {
        if (isFinished) {
            let start = 0;
            const end = 33;
            const duration = 1500;
            const timer = setInterval(() => {
                start += 1;
                setComplianceCount(start);
                if (start === end) clearInterval(timer);
            }, duration / end);
            return () => clearInterval(timer);
        }
    }, [isFinished]);

    const handleGoToDashboard = async () => {
        try {
            await completeOnboarding(onboardingData);
            useOnboardingStore.getState().completeOnboarding();
            if (onComplete) onComplete(); 
            router.push('/calendar');
        } catch (error) {
            console.error("Failed to complete onboarding:", error);
        }
    };

    return (
        <div className="space-y-8 w-full max-w-2xl">
            <div className="space-y-2">
                <h1 className="text-2xl font-bold text-slate-900">
                    Analysing your compliance requirements
                </h1>
                <p className="text-slate-500">
                    Please wait while we customize your compliance dashboard...
                </p>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-sm font-semibold text-slate-800">
                    <span>Overall Progress</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-slate-100" />
            </div>

            <div className="pt-8 flex items-start gap-4">
                <div className="mt-1">
                    <div className="h-10 w-10 bg-blue-50 rounded flex items-center justify-center text-blue-600">
                        <PlayCircle className="h-6 w-6" />
                        {/* Using PlayCircle as a placeholder for the icon in image 3 (blue icon with lines) */}
                    </div>
                </div>
                <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-800">Analysed 74K+ Compliances</h3>
                    <p className="text-slate-500 text-sm">Found the ones that fit your business profile</p>
                </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm space-y-6">
                <div className="space-y-4">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-3"
                        >
                            {/* Logic: 
                                - Current step being processed: Spinner
                                - Completed step: Green Check
                                - Pending step: Gray Circle
                             */}
                            {completedSteps.includes(index) ? (
                                <CheckCircle2 className="text-green-500 h-5 w-5 shrink-0" />
                            ) : (
                                // If it's the next pending step (index == completedSteps.length), show spinner
                                // BUT only if progress is < 100.
                                (index === completedSteps.length && progress < 100) ? (
                                    <Loader2 className="animate-spin text-blue-500 h-5 w-5 shrink-0" />
                                ) : (
                                    <div className="h-5 w-5 rounded-full border-2 border-slate-200 shrink-0" />
                                )
                            )}

                            <span className={cn(
                                "text-sm",
                                completedSteps.includes(index) ? "text-slate-800 font-medium" : "text-slate-500"
                            )}>
                                {step}
                            </span>
                        </motion.div>
                    ))}
                </div>

                <div className="bg-blue-50/50 rounded-lg p-6 flex items-center justify-between">
                    <div>
                        <h4 className="text-lg font-bold text-slate-800">Compliances Found</h4>
                        <p className="text-blue-600 text-xs font-medium">For this Financial Year</p>
                    </div>
                    <div className="text-4xl font-bold text-slate-900">
                        {complianceCount}
                    </div>
                </div>
            </div>

            {isFinished && (
                <div className="flex justify-end animate-in fade-in slide-in-from-bottom-4">
                    <Button
                        onClick={handleGoToDashboard}
                        className="bg-[#0f172a] text-white hover:bg-[#1e293b] px-8 h-12 text-md"
                    >
                        Go to dashboard &gt;
                    </Button>
                </div>
            )}
        </div>
    );
}
