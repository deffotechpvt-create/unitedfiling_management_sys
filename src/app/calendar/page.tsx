"use client"

import { useState, useEffect } from "react";
import { CalendarSidebar } from "@/components/calendar/calendar-sidebar";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { MOCK_EVENTS } from "@/components/calendar/mock-data";
import { ComplianceEvent } from "@/components/calendar/calendar-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { useRouter } from "next/navigation";
import { PlayCircle } from "lucide-react";

function CalendarIntro() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-50 p-4">
            <div className="max-w-3xl w-full bg-white rounded-xl shadow-sm border p-8 md:p-12 flex flex-col md:flex-row items-center gap-12">
                {/* Left: Illustration */}
                <div className="flex-1 relative flex justify-center">
                    {/* Placeholder for Calendar Illustration */}
                    <div className="relative w-48 h-48 md:w-64 md:h-64">
                        <div className="absolute inset-0 bg-red-100 rounded-lg transform rotate-[-6deg]" />
                        <div className="absolute inset-0 bg-white border-2 border-red-200 rounded-lg shadow-xl p-4 flex flex-col items-center">
                            <div className="w-full h-8 bg-red-500 rounded-t-sm mb-2 flex items-center justify-around px-2">
                                <div className="w-1.5 h-3 bg-slate-400 rounded-full -mt-4 bg-white ring-2 ring-slate-300" />
                                <div className="w-1.5 h-3 bg-slate-400 rounded-full -mt-4 bg-white ring-2 ring-slate-300" />
                                <div className="w-1.5 h-3 bg-slate-400 rounded-full -mt-4 bg-white ring-2 ring-slate-300" />
                                <div className="w-1.5 h-3 bg-slate-400 rounded-full -mt-4 bg-white ring-2 ring-slate-300" />
                            </div>
                            <div className="grid grid-cols-4 gap-2 w-full mt-2">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className={`h-6 rounded-sm ${i === 5 ? 'bg-red-500' : 'bg-slate-100'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Content */}
                <div className="flex-1 space-y-6 text-center md:text-left">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                        Never Miss a Compliance Due Date Again
                    </h1>

                    <ul className="space-y-4 text-slate-600 text-sm">
                        <li className="flex items-start gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                            Get a clear view of your compliance tasks for every month.
                        </li>
                        <li className="flex items-start gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                            Automatically sync your compliance deadlines with Google Calendar for easy tracking.
                        </li>
                    </ul>

                    <div className="space-y-3 pt-2">
                        <p className="font-medium text-slate-900">
                            Set up your business account to get started and unlock all features
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <Button
                                onClick={() => router.push('/onboarding')}
                                className="bg-slate-900 text-white hover:bg-slate-800"
                            >
                                Start Your Business
                            </Button>
                            <span className="text-sm text-slate-500">
                                Already Have Business? <button className="text-blue-600 font-medium hover:underline" onClick={() => router.push('/onboarding')}>Add Business</button>
                            </span>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button className="text-blue-600 text-sm flex items-center gap-1 hover:underline">
                            See how United Fillings 360 makes compliance effortless
                            <PlayCircle className="h-4 w-4" />
                            Watch Demo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState<ComplianceEvent | null>(null);
    const { hasOnboarded } = useOnboardingStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null; // Prevent hydration mismatch

    if (!hasOnboarded) {
        return <CalendarIntro />;
    }

    // In a real app, fetch events based on Month + Year
    // For now, using static mock data
    const events = MOCK_EVENTS;

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
            {/* Left Sidebar */}
            <CalendarSidebar
                events={events}
                selectedDate={currentDate}
                onSelectEvent={setSelectedEvent}
            />

            {/* Main Grid */}
            <CalendarGrid
                events={events}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                onEventClick={setSelectedEvent}
            />

            {/* Event Details Modal */}
            <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedEvent?.title}
                            {selectedEvent?.isMandatory && (
                                <Badge variant="outline" className="border-orange-200 text-orange-600 bg-orange-50">Mandatory</Badge>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedEvent?.location} • {selectedEvent?.type}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-xs text-slate-500">Due Date</span>
                                <p className="font-semibold text-sm">
                                    {selectedEvent && format(new Date(selectedEvent.dueDate), "PPP")}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-slate-500">Status</span>
                                <Badge className={
                                    selectedEvent?.status === 'NEEDS_ACTION' ? "bg-red-100 text-red-700" :
                                        selectedEvent?.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-700" :
                                            "bg-blue-100 text-blue-700"
                                }>
                                    {selectedEvent?.status.replace("_", " ")}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedEvent(null)}>Close</Button>
                        {selectedEvent?.status !== 'COMPLETED' && (
                            <Button>Mark as Completed</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
