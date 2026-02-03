'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useRouter } from 'next/navigation';

export function SuccessConfetti() {
    const [count, setCount] = useState(0);
    const finalCount = 33; // As per prompt
    const router = useRouter();
    const reset = useOnboardingStore(state => state.reset);

    useEffect(() => {
        // Trigger confetti
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Counter animation
        let start = 0;
        const duration = 2000;
        const incrementTime = duration / finalCount;

        const timer = setInterval(() => {
            start += 1;
            setCount(start);
            if (start === finalCount) clearInterval(timer);
        }, incrementTime);

        return () => clearInterval(timer);
    }, []);

    const handleGoToDashboard = () => {
        useOnboardingStore.getState().completeOnboarding();
        router.push('/calendar');
    };

    return (
        <div className="flex flex-col items-center justify-center text-center space-y-8 py-10">
            <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
                    <span className="text-blue-600 block text-6xl mb-2">{count}</span>
                    Compliances Found
                </h1>
                <p className="text-xl text-slate-600">
                    We have identified all the necessary compliances for your business.
                </p>
            </div>

            <div className="p-8 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 w-full max-w-md">
                <h2 className="text-lg font-semibold mb-4">Your Custom Compliance Calendar is Ready</h2>
                <div className="space-y-2 text-left text-sm text-slate-500">
                    <div className="flex justify-between">
                        <span>Monthly Filings</span>
                        <span className="font-bold text-slate-900">12</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Quarterly Returns</span>
                        <span className="font-bold text-slate-900">4</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Annual Compliances</span>
                        <span className="font-bold text-slate-900">5</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Event Based</span>
                        <span className="font-bold text-slate-900">12</span>
                    </div>
                </div>

                <Button
                    onClick={handleGoToDashboard}
                    className="w-full mt-6 bg-slate-900 text-white hover:bg-slate-800 h-12 text-lg"
                >
                    Go to Dashboard
                </Button>
            </div>
        </div>
    );
}
