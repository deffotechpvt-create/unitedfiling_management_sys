'use client';

import { useOnboardingStore } from '@/store/useOnboardingStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { Search } from 'lucide-react';

const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry"
];

const industries = [
    "Manufacturing", "Software / IT", "Retail", "Construction", "FMCG",
    "Healthcare", "Finance", "Education", "Logistics / Transport Industry", "Real Estate",
    "Agriculture", "Entertainment", "Legal Services", "Other"
];

export function StepCIN() {
    const { data, updateData, nextStep, prevStep } = useOnboardingStore();
    const [cinInput, setCinInput] = useState(data.cinData.cin || '');

    // Check if we are in "Manual Mode" (showing the form) or "CIN Mode" (showing just CIN input)
    // We can infer this: if data.cinData.isManual is true, we are in manual mode. 
    // BUT user can also be in manual mode via "Skip and Next".
    // Let's use local state for the View Mode, initialized from store.

    const [viewMode, setViewMode] = useState<'CIN' | 'MANUAL'>(data.cinData.isManual ? 'MANUAL' : 'CIN');

    // Manual form state
    const [manualData, setManualData] = useState({
        companyName: data.cinData.companyName || '',
        incorporationDate: data.cinData.incorporationDate ? new Date(data.cinData.incorporationDate).toISOString().split('T')[0] : '', // YYYY-MM-DD
        state: data.cinData.state || '',
        industry: data.cinData.industry || ''
    });

    const handleManualChange = (field: string, value: any) => {
        setManualData(prev => ({ ...prev, [field]: value }));
    };

    const handleSkipAndNext = () => {
        // Go to Manual Mode
        setViewMode('MANUAL');
        updateData({ cinData: { ...data.cinData, isManual: true } });
    };

    const handleManualNext = () => {
        // Save Manual Data and Proceed
        updateData({
            cinData: {
                ...data.cinData,
                isManual: true,
                companyName: manualData.companyName,
                incorporationDate: manualData.incorporationDate ? new Date(manualData.incorporationDate) : undefined,
                state: manualData.state,
                industry: manualData.industry
            }
        });
        nextStep();
    };

    // Derived State
    const isManualValid = manualData.companyName && manualData.incorporationDate && manualData.state && manualData.industry;

    if (viewMode === 'CIN') {
        return (
            <div className="space-y-8">
                <div className="space-y-6 max-w-md w-full">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-800">
                            CIN
                        </label>
                        <Input
                            placeholder="Enter your CIN"
                            value={cinInput}
                            onChange={(e) => setCinInput(e.target.value)}
                            className="h-12"
                        />
                    </div>

                    <div className="flex justify-between pt-12">
                        <Button variant="outline" onClick={prevStep} className="px-6 border-slate-300 text-slate-700 hover:bg-slate-50">
                            &lt; Prev
                        </Button>
                        <Button
                            onClick={handleSkipAndNext}
                            className="bg-[#0f172a] text-white hover:bg-[#1e293b] px-8"
                        >
                            Skip and Next &gt;
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="space-y-6 max-w-md w-full animate-in fade-in slide-in-from-right-4">

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-800">Company Name<span className="text-red-500">*</span></label>
                        <Input
                            placeholder="Company Name"
                            value={manualData.companyName}
                            onChange={(e) => handleManualChange('companyName', e.target.value)}
                            className="h-12"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-800">Date of Incorporation<span className="text-red-500">*</span></label>
                        <Input
                            type="date"
                            value={manualData.incorporationDate}
                            onChange={(e) => handleManualChange('incorporationDate', e.target.value)}
                            className="h-12 block w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-800">State<span className="text-red-500">*</span></label>
                        <Select value={manualData.state} onValueChange={(val) => handleManualChange('state', val)}>
                            <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                            <SelectContent className="h-60">
                                {indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-800">Industry Type<span className="text-red-500">*</span></label>
                        <Select value={manualData.industry} onValueChange={(val) => handleManualChange('industry', val)}>
                            <SelectTrigger className="h-12">
                                <SelectValue placeholder="Select your industry type" />
                            </SelectTrigger>
                            <SelectContent>
                                {industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-between pt-8">
                    <Button variant="outline" onClick={() => setViewMode('CIN')} className="px-6 border-slate-300 text-slate-700 hover:bg-slate-50">
                        &lt; Prev
                    </Button>
                    <Button
                        onClick={handleManualNext}
                        disabled={!isManualValid}
                        className="bg-[#0f172a] text-white hover:bg-[#1e293b] px-8"
                    >
                        Next &gt;
                    </Button>
                </div>
            </div>
        </div>
    );
}
