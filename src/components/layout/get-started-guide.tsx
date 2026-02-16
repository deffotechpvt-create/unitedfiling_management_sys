"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function GetStartedGuide() {
    const [openStep, setOpenStep] = useState<number | null>(2) // Default open step: Explore Our Services

    const steps = [
        {
            id: 1,
            title: "Complete Profile",
            description: "Complete your profile to view and track all applicable compliances for your business.",
            isCompleted: true,
            action: null
        },
        {
            id: 2,
            title: "Explore Our Services",
            description: "Explore all business services needed for smooth operations and brand protection.",
            isCompleted: false,
            action: { label: "Explore", link: "/services" }
        },
        {
            id: 3,
            title: "Explore Documents",
            description: "Access, upload, and manage your business documents in one secure place.",
            isCompleted: false,
            action: { label: "Explore", link: "/documents" }
        },
        {
            id: 4,
            title: "Consult with Legal Expert",
            description: "Consult with our legal experts to ensure your business stays legally compliant and protected.",
            isCompleted: false,
            action: { label: "Consult now", link: "/consult" }
        }
    ]

    const progress = Math.round((steps.filter(s => s.isCompleted).length / steps.length) * 100)

    const toggleStep = (id: number) => {
        setOpenStep(openStep === id ? null : id)
    }

    return (
        <div className="absolute bottom-12 left-full ml-4 w-80 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50">
            {/* Header */}
            <div className="bg-blue-50/50 p-4 border-b border-blue-100">
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                    Let's set things up to make your compliance experience smooth and powerful.
                </p>

                {/* Progress Bar */}
                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-900 mb-1">
                    <div className="h-1.5 flex-1 bg-slate-200 rounded-full mr-3 overflow-hidden">
                        <div
                            className="h-full bg-[#002A52] rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span>0{steps.filter(s => s.isCompleted).length}/0{steps.length}</span>
                </div>
            </div>

            {/* Steps List */}
            <div className="p-2 space-y-2 max-h-[400px] overflow-y-auto">
                {steps.map((step) => {
                    const isOpen = openStep === step.id
                    return (
                        <div
                            key={step.id}
                            className={cn(
                                "border rounded-lg transition-all duration-200",
                                isOpen ? "bg-white border-slate-300 shadow-sm" : "bg-slate-50 border-transparent hover:bg-slate-100"
                            )}
                        >
                            <button
                                onClick={() => toggleStep(step.id)}
                                className="w-full flex items-center justify-between p-3 text-left"
                            >
                                <div className="flex items-center gap-3">
                                    {step.isCompleted ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500 fill-current" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-slate-400" />
                                    )}
                                    <span className={cn(
                                        "text-sm font-semibold",
                                        step.isCompleted ? "text-slate-900" : "text-slate-700"
                                    )}>
                                        {step.title}
                                    </span>
                                </div>
                                {isOpen ? (
                                    <ChevronUp className="h-4 w-4 text-slate-500" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-slate-500" />
                                )}
                            </button>

                            <AnimatePresence>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-3 pb-4 pl-11">
                                            <p className="text-xs text-slate-500 leading-relaxed mb-3">
                                                {step.description}
                                            </p>

                                            {step.action && !step.isCompleted && (
                                                <div className="flex items-center gap-3">
                                                    <Button size="sm" className="bg-[#002A52] hover:bg-[#001f3f] text-white h-7 text-xs px-4">
                                                        {step.action.label}
                                                    </Button>
                                                    <button className="text-xs font-medium text-slate-500 hover:text-slate-800">
                                                        Skip
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
