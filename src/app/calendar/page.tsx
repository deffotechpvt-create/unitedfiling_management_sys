"use client"

import { useState, useEffect } from "react";
import { useCalendar } from "@/context/calendar-context";
import { useAuth } from "@/context/auth-context";
import { CalendarEvent, CalendarEventStatus } from "@/types";
import { CalendarSidebar } from "@/components/calendar/calendar-sidebar";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { useRouter } from "next/navigation";
import { PlayCircle, AlertCircle, Loader2, Calendar as CalendarIcon, Clock, CheckCircle2 } from "lucide-react";
import { canUpdateTaskStatus } from "@/lib/roles";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: CalendarEventStatus; label: string; className: string }[] = [
    { value: "pending", label: "Pending", className: "bg-blue-100 text-blue-700 border-blue-200" },
    { value: "needs_action", label: "Needs Action", className: "bg-orange-100 text-orange-700 border-orange-200" },
    { value: "in_progress", label: "In Progress", className: "bg-blue-100 text-blue-700 border-blue-200" },
    { value: "waiting_for_client", label: "Waiting For Client", className: "bg-purple-100 text-purple-700 border-purple-200" },
    { value: "completed", label: "Completed", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    { value: "delayed", label: "Delayed", className: "bg-red-100 text-red-700 border-red-200" },
    { value: "overdue", label: "Overdue", className: "bg-red-200 text-red-800 border-red-300" },
];

function CalendarIntro() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-50 p-4">
            <div className="max-w-3xl w-full bg-white rounded-xl shadow-sm border p-8 md:p-12 flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 relative flex justify-center">
                    <div className="relative w-48 h-48 md:w-64 md:h-64">
                        <div className="absolute inset-0 bg-red-100 rounded-lg transform rotate-[-6deg]" />
                        <div className="absolute inset-0 bg-white border-2 border-red-200 rounded-lg shadow-xl p-4 flex flex-col items-center">
                            <div className="w-full h-8 bg-red-500 rounded-t-sm mb-2 flex items-center justify-around px-2">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="w-1.5 h-3 bg-white ring-2 ring-slate-300 rounded-full -mt-4" />
                                ))}
                            </div>
                            <div className="grid grid-cols-4 gap-2 w-full mt-2">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className={`h-6 rounded-sm ${i === 5 ? 'bg-red-500' : 'bg-slate-100'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

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
                            Keep your regulatory obligations on track with visual indicators.
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

const STATUS_RANK: Record<string, number> = {
    'pending': 0,
    'in_progress': 3,
    'needs_action': 2,
    'waiting_for_client': 4,
    'delayed': 0.5,
    'overdue': 0.5,
    'completed': 6
};

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const { events, loading, error, updateEventStatus } = useCalendar();
    const { user } = useAuth();
    const { hasOnboarded } = useOnboardingStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    if (!hasOnboarded) {
        return <CalendarIntro />;
    }

    if (loading && events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-50 p-4">
                <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
                <p className="mt-4 text-slate-600">Loading calendar events...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-red-50 text-red-600 rounded-lg p-8 m-6 border border-red-100">
                <AlertCircle className="h-10 w-10 mb-4" />
                <h3 className="text-lg font-bold">Failed to load calendar</h3>
                <p className="text-sm opacity-90">{error}</p>
            </div>
        );
    }

    const currentStatusConfig = selectedEvent?.status
        ? STATUS_OPTIONS.find(s => s.value === selectedEvent.status)
        : null;

    const isAdmin = canUpdateTaskStatus(user?.role);

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
            <CalendarSidebar
                events={events}
                selectedDate={currentDate}
                onSelectEvent={setSelectedEvent}
            />

            <CalendarGrid
                events={events}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                onEventClick={setSelectedEvent}
            />

            <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                            <DialogTitle className="flex items-center gap-2 flex-wrap text-xl">
                                {selectedEvent?.title}
                                <Badge variant="outline" className="border-slate-200 text-slate-600 bg-slate-50 font-normal">
                                    {selectedEvent?.serviceType}
                                </Badge>
                            </DialogTitle>
                            
                            {isAdmin ? (
                                <Select
                                    value={selectedEvent?.status}
                                    onValueChange={(val: CalendarEventStatus) => {
                                        if (selectedEvent) {
                                            updateEventStatus(selectedEvent._id, val);
                                            setSelectedEvent(prev => prev ? { ...prev, status: val } : null);
                                        }
                                    }}
                                >
                                    <SelectTrigger className={cn("w-[140px] h-8 text-xs font-medium", currentStatusConfig?.className)}>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending" disabled={!!(selectedEvent && STATUS_RANK['pending'] < STATUS_RANK[selectedEvent.status])}>Pending</SelectItem>
                                        <SelectItem value="in_progress" disabled={!!(selectedEvent && STATUS_RANK['in_progress'] < STATUS_RANK[selectedEvent.status])}>In Progress</SelectItem>
                                        <SelectItem value="needs_action" disabled={!!(selectedEvent && STATUS_RANK['needs_action'] < STATUS_RANK[selectedEvent.status])}>Needs Action</SelectItem>
                                        <SelectItem value="waiting_for_client" disabled={!!(selectedEvent && STATUS_RANK['waiting_for_client'] < STATUS_RANK[selectedEvent.status])}>Waiting for Client</SelectItem>
                                        <SelectItem value="completed" disabled={!!(selectedEvent && STATUS_RANK['completed'] < STATUS_RANK[selectedEvent.status])}>Completed</SelectItem>
                                        <SelectItem value="delayed">Delayed</SelectItem>
                                        <SelectItem value="overdue">Overdue</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Badge className={cn("text-xs", currentStatusConfig?.className)}>
                                    {currentStatusConfig?.label}
                                </Badge>
                            )}
                        </div>
                        <DialogDescription className="flex items-center gap-2">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider">
                                {selectedEvent?.department}
                            </span>
                            •
                            <span className="text-slate-500 font-medium">
                                {selectedEvent?.frequency} Filing
                            </span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-6 border-y border-slate-100 my-2">
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <div className="space-y-1.5">
                                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <CalendarIcon className="h-3 w-3" /> Due Date
                                </span>
                                <p className="font-semibold text-slate-900">
                                    {selectedEvent && format(new Date(selectedEvent.deadlineDate), "PPP")}
                                </p>
                            </div>
                            
                            <div className="space-y-1.5">
                                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <Clock className="h-3 w-3" /> Time Remaining
                                </span>
                                <p className={cn("font-semibold", 
                                    (selectedEvent?.daysRemaining ?? 0) < 0 ? "text-red-600" :
                                    (selectedEvent?.daysRemaining ?? 0) <= 7 ? "text-orange-600" : "text-emerald-600"
                                )}>
                                    {selectedEvent?.daysRemaining !== undefined
                                        ? selectedEvent.daysRemaining < 0
                                            ? `${Math.abs(selectedEvent.daysRemaining)} days overdue`
                                            : `${selectedEvent.daysRemaining} days remaining`
                                        : "N/A"}
                                </p>
                            </div>

                            {selectedEvent?.completedDate && (
                                <div className="space-y-1.5 col-span-2 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/50">
                                    <span className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                        <CheckCircle2 className="h-3 w-3" /> Filed Successfully
                                    </span>
                                    <p className="font-semibold text-emerald-700 text-sm">
                                        Completed on {format(new Date(selectedEvent.completedDate), "PPP")}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

