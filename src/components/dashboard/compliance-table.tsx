"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ComplianceRecord } from "@/types"
import { cn } from "@/lib/utils"

interface ComplianceTableProps {
    data: ComplianceRecord[]
}

export function ComplianceTable({ data }: ComplianceTableProps) {

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "DELAYED":
                return (
                    <Badge variant="destructive" className="animate-pulse bg-red-500 hover:bg-red-600">
                        Delayed
                    </Badge>
                )
            case "COMPLETED":
            case "FILING_DONE":
                return (
                    <Badge className="bg-green-500 hover:bg-green-600 border-none text-white">
                        Completed
                    </Badge>
                )
            case "PENDING":
                return (
                    <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                        Pending
                    </Badge>
                )
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const getStageBadge = (stage: string) => {
        // Map stage to readable text or styles
        const map: Record<string, string> = {
            PAYMENT: "Payment",
            DOCUMENTATION: "Documentation",
            GOVT_APPROVAL: "Govt Approval",
            FILING_DONE: "Filing Done"
        }
        return <Badge variant="outline">{map[stage] || stage}</Badge>
    }

    return (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Office</TableHead>
                        <TableHead>Compliance Name</TableHead>
                        <TableHead>Expert Name</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row) => (
                        <TableRow key={row.id}>
                            <TableCell className="font-medium">{row.companyName}</TableCell>
                            <TableCell>{row.serviceType}</TableCell>
                            <TableCell>{row.expertName}</TableCell>
                            <TableCell>{new Date(row.dueDate).toLocaleDateString()}</TableCell>
                            <TableCell>{getStageBadge(row.stage)}</TableCell>
                            <TableCell>{getStatusBadge(row.status)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
