"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useCompany } from "@/context/company-context"
import { fetchCompliances } from "@/lib/api"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { RiskMatrix } from "@/components/dashboard/risk-matrix"
import { ComplianceTable } from "@/components/dashboard/compliance-table"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarWidget } from "@/components/dashboard/calendar-widget"
import { useAuth, UserRole } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import SuperAdminDashboard from "@/app/super-admin/page"

// --- Components for Different Roles ---

// 1. ADMIN View
// Admins see the compliance status of *their* assigned clients.
// For this demo, we Reuse the existing dashboard but conceptually it represents "My Clients' data"
function AdminDashboard({ role }: { role: UserRole }) {
  // We reuse the existing logic which fetches data for "Selected Company".
  // In a real app, this would query "All clients assigned to me".

  const { selectedCompany } = useCompany()
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  const { data: compliances, isLoading } = useQuery({
    queryKey: ["compliances", selectedCompany.id],
    queryFn: () => fetchCompliances(selectedCompany.id),
  })

  // Basic Filter Logic
  const filteredData = compliances
    ? compliances.filter((c) => !filterStatus || c.status === filterStatus || (filterStatus === "UPCOMING" && new Date(c.dueDate) > new Date()))
    : []

  const stats = {
    needsAction: compliances?.filter(c => c.status === "DELAYED").length || 0,
    inProgress: compliances?.filter(c => c.status === "PENDING").length || 0,
    completed: compliances?.filter(c => c.status === "COMPLETED" || c.status === "FILING_DONE").length || 0,
    upcoming: compliances?.filter(c => new Date(c.dueDate) > new Date()).length || 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {role === "ADMIN" ? "Context: My Clients' Services" : "Service Status"}
        </h1>
        {role === "ADMIN" && <span className="text-sm text-slate-500 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">Managing Client: {selectedCompany.name}</span>}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-3">
          <KPICards stats={stats} onFilterChange={setFilterStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">
            {role === "ADMIN" ? "Pending Actions" : "My Service Status"}
          </h2>
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
          <div className="space-y-6">
            <RiskMatrix />
            <CalendarWidget />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  // Protect Route
  useEffect(() => {
    if (!isAuthenticated) {
      // Handled by context, but safe double check
    }
  }, [isAuthenticated])

  if (!user) return null

  if (user.role === "SUPER_ADMIN") {
    return <SuperAdminDashboard />
  }

  // Admin and User share a similar view structure for this demo, 
  // but the data Context is different (Admin sees work to do, User sees work done).
  return <AdminDashboard role={user.role} />
}
