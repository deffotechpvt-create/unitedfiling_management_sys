"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useCompany } from "@/context/company-context"
import { fetchCompliances } from "@/lib/api"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { RiskMatrix } from "@/components/dashboard/risk-matrix"
import { ComplianceTable } from "@/components/dashboard/compliance-table"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const { selectedCompany } = useCompany()
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  const { data: compliances, isLoading } = useQuery({
    queryKey: ["compliances", selectedCompany.id],
    queryFn: () => fetchCompliances(selectedCompany.id),
  })

  // Calculate filtered data
  const filteredData = compliances
    ? compliances.filter((c) => !filterStatus || c.status === filterStatus || (filterStatus === "UPCOMING" && new Date(c.dueDate) > new Date()))
    : []

  // Calculate stats
  // "Needs Action" -> DELAYED
  // "In Progress" -> PENDING
  // "Completed" -> COMPLETED/FILING_DONE
  // "Upcoming" -> Future Date

  const stats = {
    needsAction: compliances?.filter(c => c.status === "DELAYED").length || 0,
    inProgress: compliances?.filter(c => c.status === "PENDING").length || 0,
    completed: compliances?.filter(c => c.status === "COMPLETED" || c.status === "FILING_DONE").length || 0,
    upcoming: compliances?.filter(c => new Date(c.dueDate) > new Date()).length || 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-3">
          <KPICards stats={stats} onFilterChange={setFilterStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">Compliance Status</h2>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <ComplianceTable data={filteredData} />
          )}
        </div>
        <div>
          <RiskMatrix />
        </div>
      </div>
    </div>
  )
}
