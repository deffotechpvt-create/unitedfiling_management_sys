import { ComplianceEvent } from "./calendar-types";
import { addDays, startOfMonth } from "date-fns";

const today = new Date();
const currentMonthStart = startOfMonth(today);

export const MOCK_EVENTS: ComplianceEvent[] = [
    {
        id: "1",
        title: "24Q TDS Challan Payment",
        dueDate: addDays(currentMonthStart, 6).toISOString(), // 7th of month
        type: "TDS",
        isMandatory: true,
        status: "NEEDS_ACTION",
        location: "Mumbai HQ"
    },
    {
        id: "2",
        title: "GSTR-1 Filing",
        dueDate: addDays(currentMonthStart, 10).toISOString(), // 11th
        type: "GST",
        isMandatory: true,
        status: "PENDING",
        location: "Delhi Branch"
    },
    {
        id: "3",
        title: "PF Contribution Payment",
        dueDate: addDays(currentMonthStart, 14).toISOString(), // 15th
        type: "PF",
        isMandatory: true,
        status: "UPCOMING",
        location: "All Locations"
    },
    {
        id: "4",
        title: "ESI Contribution",
        dueDate: addDays(currentMonthStart, 14).toISOString(), // 15th
        type: "ESI",
        isMandatory: true,
        status: "PENDING",
        location: "All Locations"
    },
    {
        id: "5",
        title: "Advance Tax Payment",
        dueDate: addDays(currentMonthStart, 14).toISOString(), // 15th
        type: "OTHER",
        isMandatory: true,
        status: "PENDING",
        location: "Mumbai HQ"
    },
    {
        id: "6",
        title: "GSTR-3B Filing",
        dueDate: addDays(currentMonthStart, 19).toISOString(), // 20th
        type: "GST",
        isMandatory: true,
        status: "PENDING",
        location: "Delhi Branch"
    },
    {
        id: "7",
        title: "Professional Tax Payment",
        dueDate: addDays(currentMonthStart, 27).toISOString(), // 28th
        type: "OTHER",
        isMandatory: false,
        status: "COMPLETED",
        location: "Bangalore"
    }
];
