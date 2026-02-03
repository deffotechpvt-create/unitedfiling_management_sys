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

const entityTypes = [
    "Private Limited Company(PVT)",
    "Limited Liability Partnership(LLP)",
    "One Person Company(OPC)",
    "Sole Proprietorship",
    "Partnership Firm",
    "Section 8 Company",
    "Nidhi Company",
    "Trust Registration",
    "Public Limited",
    "Producer Company",
    "Society Company",
    "Non-Banking Financial Company (NBFC)",
    "Foreign Company"
];

export function StepEntity() {
    const { data, updateData, nextStep, prevStep } = useOnboardingStore();

    const handleValueChange = (value: string) => {
        updateData({ entityType: value });
    };

    return (
        <div className="space-y-8">
            <div className="space-y-6 max-w-md w-full">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-800">
                        Entity Type<span className="text-red-500">*</span>
                    </label>
                    <Select
                        value={data.entityType}
                        onValueChange={handleValueChange}
                    >
                        <SelectTrigger className="h-12 border-slate-200">
                            <SelectValue placeholder="Select your entity type" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {entityTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
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
                        onClick={nextStep}
                        disabled={!data.entityType}
                        className="bg-[#0f172a] text-white hover:bg-[#1e293b] px-8"
                    >
                        Next &gt;
                    </Button>
                </div>
            </div>
        </div>
    );
}
