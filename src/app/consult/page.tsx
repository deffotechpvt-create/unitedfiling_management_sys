"use client"

import { Button } from "@/components/ui/button"
import { CalendarDays, Plus } from "lucide-react"

export default function ConsultPage() {
    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Consultations</h1>
                <Button className="bg-[#002A52] hover:bg-[#001f3f] text-white gap-2">
                    <Plus className="h-4 w-4" /> New Consultation
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-8 md:p-12 shadow-sm min-h-[500px] flex flex-col md:flex-row items-center gap-12">

                {/* Left Side: Content */}
                <div className="flex-1 space-y-6 text-center md:text-left">
                    {/* 3D Calendar Icon Approximation */}
                    <div className="mx-auto md:mx-0 relative w-16 h-16">
                        <div className="absolute inset-0 bg-red-400 rounded-xl transform translate-y-1 translate-x-1" />
                        <div className="absolute inset-0 bg-red-500 rounded-xl shadow-lg border-b-4 border-red-700 flex flex-col items-center overflow-hidden">
                            <div className="w-full h-4 bg-red-800 flex items-center justify-around px-2">
                                <div className="w-1 h-1 rounded-full bg-slate-900/30" />
                                <div className="w-1 h-1 rounded-full bg-slate-900/30" />
                                <div className="w-1 h-1 rounded-full bg-slate-900/30" />
                                <div className="w-1 h-1 rounded-full bg-slate-900/30" />
                            </div>
                            <div className="flex-1 w-full bg-white mt-1 grid grid-cols-4 gap-0.5 p-1">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className="bg-red-100 rounded-[1px]" />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-2xl font-bold text-slate-900">Get Expert Advice. Instantly.</h2>
                        <p className="text-slate-500 leading-relaxed max-w-md mx-auto md:mx-0">
                            Get expert guidance on compliances, legal issues, or any service you need—from registrations to filings. our experts have you covered.
                        </p>
                    </div>
                </div>

                {/* Right Side: Action Card */}
                <div className="flex-1 w-full max-w-md">
                    <div className="bg-[#002A52] rounded-xl p-6 text-white space-y-6 shadow-xl">
                        {/* Video Call Image Placeholder Area */}
                        <div className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden border border-slate-700 shadow-inner group">
                            {/* We will replace this src with the generated image artifact if available, otherwise fallback */}
                            <img
                                src="/consultation_call_mockup.png"
                                alt="Video consultation preview"
                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                onError={(e) => {
                                    // Fallback if image not found
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                                    e.currentTarget.parentElement!.innerHTML = '<div class="text-slate-400 text-sm">Video Call Preview</div>';
                                }}
                            />

                            {/* UI Overlays for Video Look */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center"><div className="h-3 w-3 bg-white rounded-full" /></div>
                                <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center"><div className="h-3 w-3 bg-white rounded-full" /></div>
                                <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center p-1.5">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm0 2c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-2 5h4v1.5h-4V9zm0 2.5h4V13h-4v-1.5zm0 2.5h4v1.5h-4V14z" /></svg>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 text-center">
                            <p className="text-sm text-slate-200">
                                Select CA or Lawyer to consult a expert advice. Instantly
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <Button className="bg-white text-[#002A52] hover:bg-slate-100 font-semibold">
                                    Talk to a CA
                                </Button>
                                <Button className="bg-white text-[#002A52] hover:bg-slate-100 font-semibold">
                                    Talk to a Lawyer
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
