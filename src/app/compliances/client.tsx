"use client"

import { useQuery } from "@tanstack/react-query"
import { useCompany } from "@/context/company-context"
import { fetchCompliances } from "@/lib/api"
import { ComplianceTable } from "@/components/dashboard/compliance-table"
import { Skeleton } from "@/components/ui/skeleton"

export function CompliancesPageClient() {
    const { selectedCompany } = useCompany()

    const { data: compliances, isLoading } = useQuery({
        queryKey: ["compliances", selectedCompany.id],
        queryFn: () => fetchCompliances(selectedCompany.id),
    })

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">All Compliances</h1>
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ) : (
                <ComplianceTable data={compliances || []} />
            )}
        </div>
    )
}
