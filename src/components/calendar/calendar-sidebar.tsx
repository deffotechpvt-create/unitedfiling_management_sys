// src/components/calendar/calendar-sidebar.tsx
"use client";

import { CalendarEvent, STATUS_CONFIG, SERVICE_TYPE_COLORS } from "./calendar-types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar as CalendarIcon } from "lucide-react";

interface CalendarSidebarProps {
    events: CalendarEvent[];
    selectedDate: Date;
    onSelectEvent: (event: CalendarEvent) => void;
}

export function CalendarSidebar({ events, selectedDate, onSelectEvent }: CalendarSidebarProps) {

    const getFilteredEvents = (tab: string) => {
        if (tab === "overdue") return events.filter(e => e.displayStatus === "overdue");
        if (tab === "pending") return events.filter(e => e.displayStatus === "pending");
        if (tab === "completed") return events.filter(e => e.displayStatus === "completed");
        return events;
    };

    const renderEventCard = (event: CalendarEvent) => (
        <div
            key={event._id}
            className={cn(
                "p-4 rounded-lg border bg-white mb-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden",
                event.status === "overdue" ? "border-red-100" : "border-slate-100"
            )}
            onClick={() => onSelectEvent(event)}
        >
            {/* Left accent bar for overdue */}
            {event.displayStatus === "overdue" && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
            )}
            {event.displayStatus === "completed" && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
            )}

            {/* Date row */}
            <div className="flex justify-between items-start mb-2 pl-2">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {format(new Date(event.deadlineDate), "dd MMM yyyy")}
                </span>
                <Badge
                    variant="outline"
                    className={cn("text-[10px] px-1.5 py-0 h-5 font-medium border",
                        STATUS_CONFIG[event.status]?.className
                    )}
                >
                    {STATUS_CONFIG[event.status]?.label}
                </Badge>
            </div>

            {/* Title */}
            <h4 className="font-semibold text-sm text-slate-800 mb-2 pl-2">{event.title}</h4>

            {/* Footer row */}
            <div className="flex justify-between items-end pl-2">
                <span className="text-xs text-slate-400">{event.department}</span>
                <Badge
                    className={cn(
                        "text-[10px] h-5 border",
                        SERVICE_TYPE_COLORS[event.serviceType] ?? "bg-slate-100 text-slate-700"
                    )}
                >
                    {event.serviceType}
                </Badge>
            </div>

            {/* Days remaining */}
            {event.daysRemaining !== undefined && event.status !== "completed" && (
                <p className={cn(
                    "text-[10px] mt-2 pl-2 font-medium",
                    event.daysRemaining < 0 ? "text-red-500" :
                        event.daysRemaining <= 7 ? "text-orange-500" : "text-slate-400"
                )}>
                    {event.daysRemaining < 0
                        ? `${Math.abs(event.daysRemaining)}d overdue`
                        : `${event.daysRemaining}d remaining`}
                </p>
            )}
        </div>
    );

    const overdueCount = events.filter(e => e.displayStatus === "overdue").length;
    const pendingCount = events.filter(e => e.displayStatus === "pending").length;
    const completedCount = events.filter(e => e.displayStatus === "completed").length;

    return (
        <div className="w-full lg:w-80 border-r bg-slate-50/50 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b bg-white shrink-0">
                <h2 className="font-semibold text-lg text-slate-900">Compliance Tasks</h2>
                <p className="text-xs text-slate-500">Track your regulatory obligations</p>
            </div>

            <Tabs defaultValue="overdue" className="flex-1 flex flex-col min-h-0">
                <div className="px-4 pt-4 shrink-0">
                    <TabsList className="w-full grid grid-cols-3 h-9">
                        <TabsTrigger value="overdue" className="text-xs">
                            Overdue {overdueCount > 0 && (
                                <span className="ml-1 bg-red-500 text-white rounded-full text-[9px] px-1">{overdueCount}</span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="text-xs">
                            Pending {pendingCount > 0 && (
                                <span className="ml-1 bg-blue-500 text-white rounded-full text-[9px] px-1">{pendingCount}</span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="text-xs">
                            Done {completedCount > 0 && (
                                <span className="ml-1 bg-emerald-500 text-white rounded-full text-[9px] px-1">{completedCount}</span>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto px-4 mt-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    <TabsContent value="overdue" className="mt-0 pb-10 focus-visible:outline-none">
                        {getFilteredEvents("overdue").length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-sm">🎉 No overdue tasks!</div>
                        ) : getFilteredEvents("overdue").map(renderEventCard)}
                    </TabsContent>

                    <TabsContent value="pending" className="mt-0 pb-10 focus-visible:outline-none">
                        {getFilteredEvents("pending").length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-sm">No pending tasks.</div>
                        ) : getFilteredEvents("pending").map(renderEventCard)}
                    </TabsContent>

                    <TabsContent value="completed" className="mt-0 pb-10 focus-visible:outline-none">
                        {getFilteredEvents("completed").length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-sm">No completed tasks yet.</div>
                        ) : getFilteredEvents("completed").map(renderEventCard)}
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
