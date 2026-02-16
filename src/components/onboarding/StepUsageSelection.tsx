'use client';

import { useOnboardingStore } from '@/store/useOnboardingStore';
import { motion } from 'framer-motion';
import { Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils'; // Assuming this exists, based on imports

export function StepUsageSelection() {
    const { data, updateData, nextStep } = useOnboardingStore();

    const handleSelect = (usage: 'business' | 'personal') => {
        updateData({ usage });
    };

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                    Let’s kickstart your compliances
                </h1>
                <p className="text-slate-500 text-lg">
                    74K+ business compliances, simplified and sorted.
                </p>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                    How do you plan to use United Fillings 360?
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card
                        className={cn(
                            "cursor-pointer p-6 hover:border-slate-400 transition-all duration-200 flex flex-col gap-4 border-2 shadow-sm hover:shadow-md",
                            data.usage === 'business' ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900 dark:border-white dark:ring-white" : "border-slate-200"
                        )}
                        onClick={() => handleSelect('business')}
                    >
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-1">Business needs</h3>
                            <p className="text-sm text-slate-500">
                                I'm using United Fillings for business filings or legal needs.
                            </p>
                        </div>
                        <div className="mt-auto flex justify-end">
                            <div className={cn(
                                "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                                data.usage === 'business' ? "border-slate-900" : "border-gray-300"
                            )}>
                                {data.usage === 'business' && <div className="h-2.5 w-2.5 rounded-full bg-slate-900" />}
                            </div>
                        </div>
                    </Card>

                    <Card
                        className={cn(
                            "cursor-pointer p-6 hover:border-slate-400 transition-all duration-200 flex flex-col gap-4 border-2 shadow-sm hover:shadow-md",
                            data.usage === 'personal' ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900 dark:border-white dark:ring-white" : "border-slate-200"
                        )}
                        onClick={() => handleSelect('personal')}
                    >
                        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                            <User size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-1">Personal needs</h3>
                            <p className="text-sm text-slate-500">
                                I'm using United Fillings for individual filings or personal legal needs.
                            </p>
                        </div>
                        <div className="mt-auto flex justify-end">
                            <div className={cn(
                                "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                                data.usage === 'personal' ? "border-slate-900" : "border-gray-300"
                            )}>
                                {data.usage === 'personal' && <div className="h-2.5 w-2.5 rounded-full bg-slate-900" />}
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="flex justify-end pt-4">
                    <Button
                        disabled={!data.usage}
                        onClick={nextStep}
                        size="lg"
                        className="px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
