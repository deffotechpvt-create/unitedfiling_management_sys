import { ComplianceRecord, Service, Document } from "@/types";

const MOCK_COMPLIANCES: ComplianceRecord[] = [
    {
        id: "1",
        companyName: "United Fillings Corp",
        serviceType: "Annual Filing",
        expertName: "Amit Sharma",
        dueDate: "2024-10-15T00:00:00Z",
        stage: "DOCUMENTATION",
        status: "PENDING",
    },
    {
        id: "2",
        companyName: "United Fillings Corp",
        serviceType: "GST Return",
        expertName: "Priya V",
        dueDate: "2024-09-20T00:00:00Z",
        stage: "FILING_DONE",
        status: "COMPLETED",
    },
    {
        id: "3",
        companyName: "United Fillings Corp",
        serviceType: "TDS Payment",
        expertName: "Rahul K",
        dueDate: "2024-09-05T00:00:00Z",
        stage: "PAYMENT",
        status: "DELAYED",
    },
    {
        id: "4",
        companyName: "TechStart",
        serviceType: "Incorporation",
        expertName: "Sneha R",
        dueDate: "2024-11-01T00:00:00Z",
        stage: "GOVT_APPROVAL",
        status: "PENDING",
    },
];

export async function fetchCompliances(companyId: string): Promise<ComplianceRecord[]> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return MOCK_COMPLIANCES;
}

export async function fetchServices(): Promise<Service[]> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [
        {
            id: "s1",
            title: "Private Limited Incorporation",
            description: "Start your business with the most popular legal structure.",
            category: "Licenses",
            price: "₹14,999",
            benefits: ["Limited Liability", "Easy Funding", "Perpetual Succession"],
            processSteps: [
                { title: "Name Approval", description: "Submit 2 unique names" },
                { title: "DSC & DIN", description: "Director signatures" },
                { title: "Incorporation", description: "File SPICe+ form" }
            ]
        },
        {
            id: "s2",
            title: "Trademark Registration",
            description: "Protect your brand identity.",
            category: "Trademarks",
            price: "₹6,999",
            benefits: ["Brand Protection", "Legal Rights", "Asset Creation"],
            processSteps: [
                { title: "Search", description: "Check availability" },
                { title: "Filing", description: "Submit application" }
            ]
        }
    ];
}

import axios from "axios";
export const getBaseURL = () => {
    if (process.env.NODE_ENV === "production") {
        return process.env.NEXT_PUBLIC_API_BASE;
    } else {
        return "http://localhost:5000/api";
    }
};
const base = getBaseURL();
console.log("AXIOS BASE URL =", base);

const api = axios.create({
    baseURL: getBaseURL(),
    withCredentials: true, // REQUIRED for cookie auth
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

export default api;
