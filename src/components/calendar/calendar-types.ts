// src/components/calendar/calendar-types.ts

import { CalendarEvent as ApiCalendarEvent, CalendarEventStatus } from "@/types";

// Re-export backend types for use in calendar components
export type { CalendarEventStatus };
export type { ApiCalendarEvent as CalendarEvent };

// Keep CalendarViewMode as is
export type CalendarViewMode = 'month' | 'week' | 'day';

// Helper: map backend serviceType to display color
export const SERVICE_TYPE_COLORS: Record<string, string> = {
    GST: "bg-blue-100 text-blue-700 border-blue-200",
    TDS: "bg-red-100 text-red-700 border-red-200",
    INCOME_TAX: "bg-purple-100 text-purple-700 border-purple-200",
    ROC: "bg-orange-100 text-orange-700 border-orange-200",
    PROFESSIONAL_TAX: "bg-green-100 text-green-700 border-green-200",
    ACCOUNTS: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

// Helper: map backend status to display label + color
export const STATUS_CONFIG: Record<CalendarEventStatus, {
    label: string;
    className: string;
}> = {
    pending: {
        label: "Pending",
        className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    needs_action: {
        label: "Needs Action",
        className: "bg-orange-100 text-orange-700 border-orange-200",
    },
    in_progress: {
        label: "In Progress",
        className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    waiting_for_client: {
        label: "Waiting For Client",
        className: "bg-purple-100 text-purple-700 border-purple-200",
    },
    completed: {
        label: "Completed",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    delayed: {
        label: "Delayed",
        className: "bg-red-100 text-red-700 border-red-200",
    },
    overdue: {
        label: "Overdue",
        className: "bg-red-200 text-red-800 border-red-300",
    },
};
