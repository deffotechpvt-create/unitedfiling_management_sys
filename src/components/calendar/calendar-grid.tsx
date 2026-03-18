// src/components/calendar/calendar-grid.tsx
"use client";

import { useState } from "react";
import { CalendarEvent, STATUS_CONFIG, SERVICE_TYPE_COLORS } from "./calendar-types";
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval,
    startOfWeek, endOfWeek, isSameMonth, isSameDay,
    addMonths, subMonths, isToday
} from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CalendarGridProps {
    events: CalendarEvent[];
    currentDate: Date;
    onDateChange: (date: Date) => void;
    onEventClick: (event: CalendarEvent) => void;
    googleSync: () => void;
    synce: boolean;
    isGoogleConnected?: boolean;
    disconnectGoogle?: () => void;
}

export function CalendarGrid({ events, currentDate, onDateChange, onEventClick, googleSync, synce, isGoogleConnected, disconnectGoogle }: CalendarGridProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Filter Logic
    const filteredEvents = events.filter(e => {
        const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" ? true : e.displayStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Date Logic
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const handlePrevMonth = () => onDateChange(subMonths(currentDate, 1));
    const handleNextMonth = () => onDateChange(addMonths(currentDate, 1));
    const handleToday = () => onDateChange(new Date());

    return (
        <div className="flex-1 flex flex-col h-full bg-white">

            {/* Header Controls */}
            <div className="p-4 border-b space-y-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">

                    {/* Month Navigation */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 border rounded-md p-0.5 bg-slate-50">
                            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-7 w-7">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-semibold min-w-[120px] text-center">
                                {format(currentDate, "MMMM yyyy")}
                            </span>
                            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-7 w-7">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleToday} className="hidden md:flex">
                            Today
                        </Button>
                    </div>

                    {/* Search / Sync Container */}
                    <div className="flex items-center gap-3 w-full xl:w-auto overflow-hidden">
                        
                        {isGoogleConnected ? (
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={googleSync}
                                    disabled={synce}
                                    variant="outline" size="sm" className="gap-2 text-slate-600 transition-all">
                                    {synce ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-t-[#EA4335] border-r-[#FBBC05] border-b-[#34A853] border-l-[#4285F4]" />
                                    ) : (
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                    )}
                                    <span className="hidden sm:inline">{synce ? "Syncing..." : "Sync Now"}</span>
                                </Button>
                                <Button
                                    onClick={disconnectGoogle}
                                    disabled={synce}
                                    variant="destructive" size="sm" className="hidden sm:flex transition-all">
                                    Disconnect
                                </Button>
                            </div>
                        ) : (
                            <Button
                                onClick={googleSync}
                                disabled={synce}
                                variant="outline" size="sm" className="gap-2 text-slate-600 transition-all min-w-[140px]">
                                {synce ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-t-[#EA4335] border-r-[#FBBC05] border-b-[#34A853] border-l-[#4285F4]" />
                                ) : (
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                )}
                                <span className="hidden sm:inline">{synce ? "Syncing..." : "Sync with Google"}</span>
                            </Button>
                        )}

                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                            <Input
                                placeholder="Search compliance..."
                                className="pl-8 h-9 text-xs"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Filter + Legend Row */}
                <div className="flex items-center justify-between flex-wrap gap-2">

                    {/* Status Filter Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {["all", "pending", "overdue", "completed"].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={cn(
                                    "text-xs px-3 py-1 rounded-full border font-medium transition-colors capitalize",
                                    statusFilter === s
                                        ? "bg-slate-900 text-white border-slate-900"
                                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                                )}
                            >
                                {s === "all" ? "All" : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label ?? s}
                            </button>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 flex-wrap">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500" /> Overdue
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500" /> Pending
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" /> Completed
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto p-4">

                {/* Week Header */}
                <div className="grid grid-cols-7 mb-2">
                    {weekDays.map(d => (
                        <div key={d} className="text-center text-xs font-medium text-slate-400 py-2 uppercase tracking-wider">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 md:gap-2 auto-rows-fr min-h-[500px]">
                    {days.map(day => {
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const dayEvents = filteredEvents.filter(e =>
                            isSameDay(new Date(e.deadlineDate), day)
                        );

                        return (
                            <div
                                key={day.toISOString()}
                                className={cn(
                                    "border rounded-md p-1 md:p-2 flex flex-col min-h-[80px] md:min-h-[100px] transition-colors",
                                    !isCurrentMonth
                                        ? "bg-slate-50 text-slate-400 border-slate-100"
                                        : "bg-white border-slate-200 hover:border-blue-300",
                                    isToday(day) && "ring-1 ring-blue-500 bg-blue-50/10"
                                )}
                            >
                                {/* Day Number */}
                                <div className="flex justify-between items-start mb-1">
                                    <span className={cn(
                                        "text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full",
                                        isToday(day) ? "bg-blue-600 text-white" : ""
                                    )}>
                                        {format(day, "d")}
                                    </span>
                                </div>

                                {/* Events */}
                                <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                                    {dayEvents.slice(0, 3).map(event => (
                                        <div
                                            key={event._id}
                                            onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                                            className={cn(
                                                "text-[10px] px-1.5 py-0.5 rounded border truncate cursor-pointer font-medium flex items-center gap-1",
                                                event.displayStatus === "overdue"
                                                    ? "bg-red-50 border-red-100 text-red-700"
                                                    : event.displayStatus === "completed"
                                                        ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                                                        : "bg-blue-50 border-blue-100 text-blue-700"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-1 h-1 rounded-full shrink-0",
                                                event.displayStatus === "overdue" ? "bg-red-500" :
                                                    event.displayStatus === "completed" ? "bg-emerald-500" : "bg-blue-500"
                                            )} />
                                            {event.title}
                                        </div>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <div className="text-[9px] text-slate-400 pl-1">
                                            +{dayEvents.length - 3} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
