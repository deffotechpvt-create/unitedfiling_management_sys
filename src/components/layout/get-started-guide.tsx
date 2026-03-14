"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function GetStartedGuide() {
    const { user, updateOnboardingTask } = useAuth()
    const router = useRouter();
    const [openStep, setOpenStep] = useState<number | null>(null)

    const tasks = useMemo(() => user?.onboardingTasks || {
        exploreServices: false,
        exploreDocuments: false,
        consultExpert: false,
    }, [user?.onboardingTasks]);

    const steps = useMemo(() => [
        {
            id: 2,
            taskKey: 'exploreServices',
            title: "Explore Our Services",
            description: "Explore all business services needed for smooth operations and brand protection.",
            isCompleted: tasks.exploreServices,
            action: { label: "Explore", link: "/services" }
        },
        {
            id: 3,
            taskKey: 'exploreDocuments',
            title: "Explore Documents",
            description: "Access, upload, and manage your business documents in one secure place.",
            isCompleted: tasks.exploreDocuments,
            action: { label: "Explore", link: "/documents" }
        },
        {
            id: 4,
            taskKey: 'consultExpert',
            title: "Consult with Legal Expert",
            description: "Consult with our legal experts to ensure your business stays legally compliant and protected.",
            isCompleted: tasks.consultExpert,
            action: { label: "Consult now", link: "/consult" }
        }
    ], [tasks]);

    const completedCount = steps.filter(s => s.isCompleted).length
    const progress = Math.round((completedCount / steps.length) * 100)

    // Set default open step to first incomplete step
    useEffect(() => {
        const firstIncomplete = steps.find(s => !s.isCompleted)
        if (firstIncomplete) {
            setOpenStep(firstIncomplete.id)
        } else {
            setOpenStep(steps[0].id)
        }
    }, [steps])

    const toggleStep = (id: number) => {
        setOpenStep(openStep === id ? null : id)
    }

    const isAllCompleted = completedCount === steps.length

    return (
        <div className="absolute bottom-12 left-full ml-4 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-50/80 via-white to-white p-5 border-b border-slate-100">
                <div className="flex items-start justify-between mb-4">
                    <p className="text-[13px] text-slate-600 font-medium leading-relaxed max-w-[85%]">
                        {isAllCompleted
                            ? "You're all set! Your business compliance is now on total track. Welcome to United Fillings."
                            : "Let's set things up to make your compliance experience smooth and powerful."}
                    </p>
                    {isAllCompleted && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 10 }}
                            className="bg-green-100 p-1 rounded-full"
                        >
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </motion.div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 mb-1.5 uppercase tracking-wider">
                    <div className="h-1.5 flex-1 bg-slate-100 rounded-full mr-4 overflow-hidden border border-slate-50">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-gradient-to-r from-blue-600 to-[#002A52] rounded-full shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                        />
                    </div>
                    <span>{steps.filter(s => s.isCompleted).length}/{steps.length}</span>
                </div>
            </div>

            {/* Steps List */}
            <div className="p-3 space-y-2.5 max-h-[420px] overflow-y-auto bg-slate-50/30">
                {isAllCompleted ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="py-10 px-4 text-center space-y-5"
                    >
                        <div className="relative inline-block">
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 0.2, 0.5]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 bg-green-400 rounded-full blur-xl"
                            />
                            <div className="relative bg-green-500 text-white p-4 rounded-full shadow-lg">
                                <ShieldCheck className="h-8 w-8" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-900">Compliance Ready!</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Great job completing the setup. You've unlocked the full potential of our platform. We're here to help you grow.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg font-bold text-xs uppercase tracking-widest h-10"
                            onClick={() => router.push("/")}
                        >
                            Explore Dashboard
                        </Button>
                    </motion.div>
                ) : (
                    steps.map((step) => {
                        const isOpen = openStep === step.id
                        return (
                            <div
                                key={step.id}
                                className={cn(
                                    "border rounded-xl transition-all duration-300",
                                    isOpen
                                        ? "bg-white border-blue-200 shadow-md translate-x-1"
                                        : "bg-white border-slate-100 hover:border-slate-300 shadow-sm"
                                )}
                            >
                                <button
                                    onClick={() => toggleStep(step.id)}
                                    className="w-full flex items-center justify-between p-3.5 text-left"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="relative">
                                            {step.isCompleted ? (
                                                <div className="bg-green-100 rounded-full p-1">
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                </div>
                                            ) : (
                                                <div className="h-6 w-6 rounded-full border-2 border-slate-200 flex items-center justify-center">
                                                    <span className="text-[10px] font-bold text-slate-400">{step.id}</span>
                                                </div>
                                            )}
                                        </div>
                                        <span className={cn(
                                            "text-[13px] font-bold tracking-tight",
                                            step.isCompleted ? "text-slate-900" : "text-slate-700"
                                        )}>
                                            {step.title}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "p-1 rounded-md transition-colors",
                                        isOpen ? "bg-slate-50" : "group-hover:bg-slate-50"
                                    )}>
                                        {isOpen ? (
                                            <ChevronUp className="h-4 w-4 text-slate-400" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-slate-400" />
                                        )}
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-3.5 pb-4 pl-[54px] pr-4">
                                                <p className="text-[12px] text-slate-500 leading-relaxed mb-4 border-l-2 border-slate-100 pl-3">
                                                    {step.description}
                                                </p>

                                                {step.action && !step.isCompleted && (
                                                    <div className="flex items-center gap-4">
                                                        <Link href={step.action.link}>
                                                            <Button
                                                                size="sm"
                                                                className="bg-[#002A52] hover:bg-[#001f3f] text-white h-8 text-[11px] font-bold px-5 rounded-lg shadow-md transition-all active:scale-95"
                                                                onClick={() => updateOnboardingTask(step.taskKey as any)}
                                                            >
                                                                {step.action.label}
                                                            </Button>
                                                        </Link>
                                                        <button
                                                            className="text-[11px] font-bold text-slate-400 hover:text-slate-800 transition-colors py-1"
                                                            onClick={() => updateOnboardingTask(step.taskKey as any)}
                                                        >
                                                            SKIP TASK
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
