"use client"

import React, { createContext, useContext, useState } from "react"
import { Company } from "@/types"

interface CompanyContextType {
    selectedCompany: Company
    setSelectedCompany: (company: Company) => void
    companies: Company[]
}

const MOCK_COMPANIES: Company[] = [
    { id: "1", name: "United Fillings Corp", role: "Owner" },
    { id: "2", name: "TechStart Solutions", role: "Admin" },
    { id: "3", name: "Dixon Ventures", role: "Viewer" },
]

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: React.ReactNode }) {
    const [selectedCompany, setSelectedCompany] = useState<Company>(MOCK_COMPANIES[0])

    return (
        <CompanyContext.Provider value={{ selectedCompany, setSelectedCompany, companies: MOCK_COMPANIES }}>
            {children}
        </CompanyContext.Provider>
    )
}

export function useCompany() {
    const context = useContext(CompanyContext)
    if (context === undefined) {
        throw new Error("useCompany must be used within a CompanyProvider")
    }
    return context
}
