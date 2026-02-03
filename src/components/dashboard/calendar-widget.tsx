"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function CalendarWidget() {
    const [date, setDate] = React.useState<Date | undefined>(new Date())

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-sm font-medium">Compliance Calendar</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border shadow-sm"
                />
            </CardContent>
        </Card>
    )
}
