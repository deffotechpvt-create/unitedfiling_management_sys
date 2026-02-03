export interface ComplianceEvent {
    id: string;
    title: string;
    dueDate: string; // ISO format
    type: 'TDS' | 'ESI' | 'PF' | 'GST' | 'OTHER';
    isMandatory: boolean;
    status: 'NEEDS_ACTION' | 'PENDING' | 'COMPLETED' | 'UPCOMING';
    location: string;
}

export type CalendarViewMode = 'month' | 'week' | 'day';
