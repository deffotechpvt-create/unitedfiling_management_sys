'use client';

import { useOnboardingStore } from '@/store/useOnboardingStore';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

const teamSizes = ["No employees", "1 - 10", "11 - 20", "21 - 50", "51 - 100", "100+"];
const turnovers = [
    "0 - 10 Lakhs", "10 - 20 Lakhs", "20 - 40 Lakhs",
    "40 Lakhs - 1 CR", "1 CR - 2 CR", "2 CR - 5 CR", "5 CR - 10 CR", "10 CR+"
];

export function StepScale() {
    const { data, updateData, nextStep, prevStep } = useOnboardingStore();

    // View state to handle the split-screen flow for Team Size -> Turnover
    const [view, setView] = useState<'TEAM' | 'TURNOVER'>('TEAM');

    const handleNext = () => {
        nextStep(); // Triggers loading state
    };

    const handleTeamNext = () => {
        setView('TURNOVER');
    };

    const handleTurnoverPrev = () => {
        setView('TEAM');
    };

    if (view === 'TEAM') {
        return (
            <div className="space-y-8">
                <div className="space-y-6 max-w-md w-full animate-in fade-in slide-in-from-right-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-800">
                            Team Size<span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={data.scale.teamSize}
                            onValueChange={(val) => updateData({ scale: { ...data.scale, teamSize: val } })}
                        >
                            <SelectTrigger className="h-12 border-slate-200">
                                <SelectValue placeholder="Select your team size" />
                            </SelectTrigger>
                            <SelectContent>
                                {teamSizes.map((size) => (
                                    <SelectItem key={size} value={size}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-between pt-12">
                        <Button variant="outline" onClick={prevStep} className="px-6 border-slate-300 text-slate-700 hover:bg-slate-50">
                            &lt; Prev
                        </Button>
                        <Button
                            onClick={handleTeamNext}
                            disabled={!data.scale.teamSize}
                            className="bg-[#0f172a] text-white hover:bg-[#1e293b] px-8"
                        >
                            Next &gt;
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Turnover View
    return (
        <div className="space-y-8">
            <div className="space-y-6 max-w-md w-full animate-in fade-in slide-in-from-right-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-800">
                        Annual Turnover<span className="text-red-500">*</span>
                    </label>
                    <Select
                        value={data.scale.turnover}
                        onValueChange={(val) => updateData({ scale: { ...data.scale, turnover: val } })}
                    >
                        <SelectTrigger className="h-12 border-slate-200">
                            <SelectValue placeholder="Select your annual turnover" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {turnovers.map((t) => (
                                <SelectItem key={t} value={t}>
                                    {t}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex justify-between pt-12">
                    <Button variant="outline" onClick={handleTurnoverPrev} className="px-6 border-slate-300 text-slate-700 hover:bg-slate-50">
                        &lt; Prev
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={!data.scale.turnover}
                        className="bg-[#0f172a] text-white hover:bg-[#1e293b] px-8"
                    >
                        Get Started &gt;
                    </Button>
                </div>
            </div>
        </div>
    );
}
