// src/context/calendar-context.tsx
"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { calendarService } from "@/services/calendarService";
import {
    CalendarEvent,
    CalendarEventStatus,
    CalendarContextType,
    CalendarFilters,
} from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: React.ReactNode }) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { user } = useAuth();

    // Fetch events based on role automatically
    const fetchEvents = useCallback(async (filters?: CalendarFilters & { clientId?: string }) => {
        if (!user) return;

        try {
            if (events.length === 0) setLoading(true);
            setError(null);

            let res;

            if (user.role === "USER") {
                // USER: fetch own calendar
                res = await calendarService.getEvents(filters);
            } else if ((user.role === "ADMIN" || user.role === "SUPER_ADMIN") && filters?.clientId) {
                // ADMIN/SUPER_ADMIN: fetch specific client's calendar
                res = await calendarService.getClientCalendar(filters.clientId, filters);
            } else {
                // ADMIN/SUPER_ADMIN without clientId — nothing to show
                setEvents([]);
                return;
            }

            if (res.success) {
                setEvents(res.events);
            }
        } catch (err: any) {
            const message = err.response?.data?.message || "Failed to fetch calendar events";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [user?.role]);
    // Fetch ALL events across all clients (ADMIN/SUPER_ADMIN)
    const fetchAdminEvents = useCallback(async (filters?: CalendarFilters) => {
        if (!user) return;

        try {
            if (events.length === 0) setLoading(true);
            setError(null);

            // Use the admin-specific endpoint — no clientId needed
            const res = await calendarService.getAllAdminEvents(filters);
            if (res.success) {
                setEvents(res.events);
            }
        } catch (err: any) {
            const message = err.response?.data?.message || "Failed to fetch admin calendar events";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Fetch upcoming deadlines (USER only)
    const fetchUpcoming = useCallback(async (days: number = 30) => {
        if (!user || user.role !== "USER") return;

        try {
            if (upcomingEvents.length === 0) setLoading(true);
            setError(null);
            const res = await calendarService.getUpcoming(days);
            if (res.success) {
                setUpcomingEvents(res.events);
            }
        } catch (err: any) {
            const message = err.response?.data?.message || "Failed to fetch upcoming events";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Update event status
    const updateEventStatus = useCallback(
        async (id: string, status: CalendarEventStatus) => {
            const previousEvents = [...events];
            const previousUpcoming = [...upcomingEvents];

            // Optimistic update
            const updateLocal = (prev: CalendarEvent[]) => 
                prev.map((e) => (e._id === id ? { ...e, status } : e));
            
            setEvents(updateLocal);
            setUpcomingEvents(updateLocal);

            try {
                setError(null);
                await calendarService.updateStatus(id, status);
                window.dispatchEvent(new CustomEvent('app:sync-calendar'));
                toast.success(`Updated to ${status}`);
            } catch (err: any) {
                setEvents(previousEvents);
                setUpcomingEvents(previousUpcoming);
                const message = err.response?.data?.message || "Failed to update event status";
                toast.error(message);
            }
        },
        [events, upcomingEvents]
    );

    // Auto-fetch on mount based on role
    useEffect(() => {
        if (!user) return;

        if (user.role === "USER") {
            // USER: auto-fetch their own events
            fetchEvents({ year: new Date().getFullYear() });
            fetchUpcoming(30);
        } else if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
            // ADMIN/SUPER_ADMIN: fetch ALL their clients' events combined
            fetchAdminEvents({ year: new Date().getFullYear() });
        }
    }, [user, fetchEvents, fetchAdminEvents, fetchUpcoming]);
    
    useEffect(() => {
        const handleSync = (e: any) => {
            if (!user) return;
            if (e.type === 'app:sync-calendar' || e.type === 'app:sync-data') {
                console.log(`[Calendar] 🔄 Syncing data from broadcast (${e.type})...`);
                if (user.role === "USER") {
                    fetchEvents({ year: new Date().getFullYear() });
                    fetchUpcoming(30);
                } else {
                    fetchAdminEvents({ year: new Date().getFullYear() });
                }
            }
        };
        window.addEventListener('app:sync-data', handleSync);
        window.addEventListener('app:sync-calendar', handleSync);
        return () => {
            window.removeEventListener('app:sync-data', handleSync);
            window.removeEventListener('app:sync-calendar', handleSync);
        };
    }, [user, fetchEvents, fetchAdminEvents, fetchUpcoming]);


    const value: CalendarContextType = {
        events,
        upcomingEvents,
        loading,
        error,
        fetchEvents,
        fetchUpcoming,
        updateEventStatus,
    };

    return (
        <CalendarContext.Provider value={value}>
            {children}
        </CalendarContext.Provider>
    );
}

export function useCalendar() {
    const context = useContext(CalendarContext);
    if (context === undefined) {
        throw new Error("useCalendar must be used within a CalendarProvider");
    }
    return context;
}
