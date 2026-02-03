"use client"

import { ComplianceEvent } from "./calendar-types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertCircle, Clock, CheckCircle2, Calendar as CalendarIcon } from "lucide-react";

interface CalendarSidebarProps {
    events: ComplianceEvent[];
    selectedDate: Date;
    onSelectEvent: (event: ComplianceEvent) => void;
}

export function CalendarSidebar({ events, selectedDate, onSelectEvent }: CalendarSidebarProps) {

    const getFilteredEvents = (status: string) => { // 'needs-action' | 'pending' | 'upcoming'
        // Map tab value to status enum
        // This is a simple logic mapping
        if (status === 'needs-action') return events.filter(e => e.status === 'NEEDS_ACTION' || (e.status === 'PENDING' && new Date(e.dueDate) < new Date()));
        if (status === 'pending') return events.filter(e => e.status === 'PENDING' || e.status === 'UPCOMING');
        if (status === 'upcoming') return events.filter(e => new Date(e.dueDate) > new Date());
        return events;
    };

    const renderEventCard = (event: ComplianceEvent) => (
        <div
            key={event.id}
            className={cn(
                "p-4 rounded-lg border bg-white mb-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden",
                event.status === 'NEEDS_ACTION' ? "border-red-100" : "border-slate-100"
            )}
            onClick={() => onSelectEvent(event)}
        >
            {event.status === 'NEEDS_ACTION' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
            )}

            <div className="flex justify-between items-start mb-2 pl-2">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {format(new Date(event.dueDate), "dd MMM yyyy")}
                </span>
                {event.isMandatory && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 border-orange-200 text-orange-600 bg-orange-50 font-bold">
                        M
                    </Badge>
                )}
            </div>

            <h4 className="font-semibold text-sm text-slate-800 mb-1 pl-2">{event.title}</h4>

            <div className="flex justify-between items-end pl-2">
                <span className="text-xs text-slate-400">{event.location}</span>
                <Badge className={cn("text-[10px] h-5",
                    event.type === 'TDS' ? "bg-blue-100 text-blue-700 hover:bg-blue-100" :
                        event.type === 'GST' ? "bg-purple-100 text-purple-700 hover:bg-purple-100" :
                            "bg-slate-100 text-slate-700 hover:bg-slate-100"
                )}>
                    {event.type}
                </Badge>
            </div>
        </div>
    );

    return (
        <div className="w-full lg:w-80 border-r bg-slate-50/50 flex flex-col h-[calc(100vh-4rem)]">
            <div className="p-4 border-b bg-white">
                <h2 className="font-semibold text-lg text-slate-900">Compliance Tasks</h2>
                <p className="text-xs text-slate-500">Track your regulatory obligations</p>
            </div>

            <Tabs defaultValue="needs-action" className="flex-1 flex flex-col">
                <div className="px-4 pt-4">
                    <TabsList className="w-full grid grid-cols-3 h-9">
                        <TabsTrigger value="needs-action" className="text-xs">Action</TabsTrigger>
                        <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
                        <TabsTrigger value="upcoming" className="text-xs">Upcoming</TabsTrigger>
                    </TabsList>
                </div>

                <ScrollArea className="flex-1 p-4">
                    <TabsContent value="needs-action" className="mt-0">
                        {getFilteredEvents('needs-action').length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-sm">No actions needed.</div>
                        ) : getFilteredEvents('needs-action').map(renderEventCard)}
                    </TabsContent>

                    <TabsContent value="pending" className="mt-0">
                        {getFilteredEvents('pending').map(renderEventCard)}
                    </TabsContent>

                    <TabsContent value="upcoming" className="mt-0">
                        {getFilteredEvents('upcoming').map(renderEventCard)}
                    </TabsContent>
                </ScrollArea>
            </Tabs>
        </div>
    );
}
