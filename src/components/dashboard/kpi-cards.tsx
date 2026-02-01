"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Clock, Hourglass } from "lucide-react"

interface KPICardsProps {
    stats: {
        needsAction: number
        inProgress: number
        completed: number
        upcoming: number
    }
    onFilterChange: (status: string) => void
}

export function KPICards({ stats, onFilterChange }: KPICardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card
                className="cursor-pointer border-l-4 border-l-red-500 hover:shadow-md transition-shadow"
                onClick={() => onFilterChange("DELAYED")}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Needs Action</CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.needsAction}</div>
                    <p className="text-xs text-muted-foreground">Immediate attention required</p>
                </CardContent>
            </Card>

            <Card
                className="cursor-pointer border-l-4 border-l-orange-500 hover:shadow-md transition-shadow"
                onClick={() => onFilterChange("PENDING")}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                    <Hourglass className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.inProgress}</div>
                    <p className="text-xs text-muted-foreground">Currently active tasks</p>
                </CardContent>
            </Card>

            <Card
                className="cursor-pointer border-l-4 border-l-green-500 hover:shadow-md transition-shadow"
                onClick={() => onFilterChange("COMPLETED")}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.completed}</div>
                    <p className="text-xs text-muted-foreground">In the last 30 days</p>
                </CardContent>
            </Card>

            <Card
                className="cursor-pointer border-l-4 border-l-blue-500 hover:shadow-md transition-shadow"
                onClick={() => onFilterChange("UPCOMING")}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                    <Clock className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.upcoming}</div>
                    <p className="text-xs text-muted-foreground">Due next month</p>
                </CardContent>
            </Card>
        </div>
    )
}
