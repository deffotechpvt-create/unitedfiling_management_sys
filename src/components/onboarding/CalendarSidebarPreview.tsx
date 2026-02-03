'use client';

import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useRouter } from 'next/navigation';

export function CalendarSidebarPreview() {
    const router = useRouter();

    return (
        <div className="flex flex-col h-full bg-[#002A52] text-white p-6 relative">
            <div className="absolute top-8 left-8">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-yellow-400 transform -skew-x-12" />
                    <span className="text-2xl font-bold tracking-tight">United Fillings</span>
                </div>
            </div>

            <div className="mt-24 space-y-6">
                {/* Mini Calendar Mockup */}
                <div className="bg-white rounded-lg p-4 text-slate-800 shadow-lg">
                    <div className="text-sm font-semibold mb-2">30 days</div>
                    <div className="text-xs text-slate-500 mb-4">Feb 02, 2026 - Mar 04, 2026</div>

                    {/* Grid */}
                    <div className="grid grid-cols-7 gap-1 text-[10px] text-center mb-2 font-medium bg-slate-50 p-1 rounded">
                        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-[10px] text-center">
                        {/* Mock Calendar Days */}
                        <div className="p-1">1</div><div className="p-1">2</div><div className="p-1">3</div><div className="p-1">4</div><div className="p-1">5</div><div className="p-1">6</div><div className="p-1">7</div>
                        <div className="p-1">8</div><div className="p-1">9</div><div className="p-1">10</div><div className="p-1">11</div><div className="p-1">12</div><div className="p-1">13</div><div className="p-1">14</div>
                        <div className="p-1 bg-red-100 text-red-600 rounded">15</div><div className="p-1">16</div><div className="p-1">17</div><div className="p-1">18</div><div className="p-1">19</div><div className="p-1">20</div><div className="p-1">21</div>
                        <div className="p-1">22</div><div className="p-1">23</div><div className="p-1">24</div><div className="p-1">25</div><div className="p-1">26</div><div className="p-1">27</div><div className="p-1">28</div>
                        <div className="p-1">1</div><div className="p-1">2</div><div className="p-1">3</div><div className="p-1">4</div><div className="p-1">5</div><div className="p-1">6</div><div className="p-1">7</div>
                    </div>
                </div>

                {/* Task List Mockup */}
                <div className="bg-white rounded-lg p-4 text-slate-800 shadow-lg space-y-3">
                    <div className="flex items-start gap-2 text-[10px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1" />
                        <div className="flex-1">
                            <div className="font-semibold">07 Feb : 24Q TDS Challan Payment - January</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-2 text-[10px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1" />
                        <div className="flex-1">
                            <div className="font-semibold">15 Feb : Employee State Insurance (ESI) Filings - January</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-2 text-[10px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1" />
                        <div className="flex-1">
                            <div className="font-semibold">28 Feb : Payroll Processing & Salary Disbursement - Febru...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
