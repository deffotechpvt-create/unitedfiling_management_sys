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

const designations = [
    "Chief Financial Officer (CFO)",
    "Finance Manager / Controller",
    "Accounts Executive / Accountant", // Added based on image
    "Company Secretary (CS)", // Added based on image
    "Tax Consultant / CA",
    "Legal Advisor / Legal Team",
    "Operations Manager",
    "Business Owner / Founder / CEO",
    "IT Administrator",
    "Office Manager / Admin",
    "Compliance Officer",
    "HR Manager / HR Team",
    "Payroll Manager",
    "External Auditor",
    "Others"
];

export function StepDesignation() {
    const { data, updateData, nextStep, prevStep } = useOnboardingStore();

    const handleValueChange = (value: string) => {
        updateData({ designation: value });
    };

    return (
        <div className="space-y-8">
            <div className="space-y-6 max-w-md w-full">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-800">
                        Designation<span className="text-red-500">*</span>
                    </label>
                    <Select
                        value={data.designation}
                        onValueChange={handleValueChange}
                    >
                        <SelectTrigger className="h-12 border-slate-200">
                            <SelectValue placeholder="Select your designation" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {designations.map((role) => (
                                <SelectItem key={role} value={role}>
                                    {role}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex justify-between pt-12">
                    <Button variant="outline" onClick={prevStep} className="px-6 border-slate-300 text-slate-700 hover:bg-slate-50">
                        &lt; Prev
                    </Button>
                    {/* According to image, Next is disabled until selected, likely handled by UI logic but visually solid when active */}
                    <Button
                        onClick={nextStep}
                        disabled={!data.designation}
                        className="bg-[#0f172a] text-white hover:bg-[#1e293b] px-8"
                    >
                        Next &gt;
                    </Button>
                </div>
            </div>
        </div>
    );
}
