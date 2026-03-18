// src/services/calendarService.ts
import api from "@/lib/api";
import {
  CalendarApiResponse,
  CalendarEvent,
  CalendarEventStatus,
  CalendarFilters,
} from "@/types";

export const calendarService = {

  // GET /api/calendar — fetch all events for logged-in client (USER)
  getEvents: async (filters?: CalendarFilters): Promise<CalendarApiResponse> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.serviceType) params.append("serviceType", filters.serviceType);
    if (filters?.year) params.append("year", filters.year.toString());

    const res = await api.get(`/calendar${params.toString() ? `?${params.toString()}` : ""}`);
    return res.data;
  },

  // GET /api/google/auth - Get Google OAuth URL or Sync if already connected
  getGoogleAuthUrl: async (): Promise<{ url: string | null; synced?: boolean }> => {
    const res = await api.get('/google/auth');
    return res.data;
  },

  // GET /api/google/status - Check if already connected
  getGoogleSyncStatus: async (): Promise<{ connected: boolean }> => {
    const res = await api.get('/google/status');
    return res.data;
  },

  // POST /api/google/disconnect - Revoke tokens and wipe synced events
  disconnectGoogleCalendar: async (): Promise<{ message: string }> => {
    const res = await api.post('/google/disconnect');
    return res.data;
  },

  // GET /api/calendar/upcoming — fetch upcoming deadlines (next N days)
  getUpcoming: async (days: number = 30): Promise<CalendarApiResponse> => {
    const res = await api.get(`/calendar/upcoming?days=${days}`);
    return res.data;
  },

  // PUT /api/calendar/:id/status — update event status (ADMIN/SUPER_ADMIN)
  updateStatus: async (
    id: string,
    status: CalendarEventStatus
  ): Promise<{ success: boolean; message: string; event: CalendarEvent }> => {
    const res = await api.put(`/calendar/${id}/status`, { status });
    return res.data;
  },

  // POST /api/calendar/generate — generate events for a client (ADMIN/SUPER_ADMIN)
  generateEvents: async (data: {
    clientId: string;
    companyId: string;
    serviceTypes: string[];
    year?: number;
  }): Promise<{ success: boolean; message: string; results: any[] }> => {
    const res = await api.post("/calendar/generate", data);
    return res.data;
  },
  // GET /api/calendar/admin — fetch ALL events for admin (all their clients)
  getAllAdminEvents: async (filters?: CalendarFilters): Promise<CalendarApiResponse> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.serviceType) params.append("serviceType", filters.serviceType);
    if (filters?.year) params.append("year", filters.year.toString());

    const res = await api.get(`/calendar/admin${params.toString() ? `?${params.toString()}` : ""}`);
    return res.data;
  },

  // GET /api/calendar/client/:clientId — admin views a client's calendar
  getClientCalendar: async (
    clientId: string,
    filters?: CalendarFilters
  ): Promise<CalendarApiResponse> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.serviceType) params.append("serviceType", filters.serviceType);
    if (filters?.year) params.append("year", filters.year.toString());

    const res = await api.get(
      `/calendar/client/${clientId}${params.toString() ? `?${params.toString()}` : ""}`
    );
    return res.data;
  },
};
