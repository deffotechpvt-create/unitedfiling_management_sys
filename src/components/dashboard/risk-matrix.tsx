"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function RiskMatrix() {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Risk Based Compliances</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium">High Risk</span>
                        <span className="text-red-500 font-bold">12%</span>
                    </div>
                    <Progress value={12} className="h-2 bg-red-100 [&>div]:bg-red-500" />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium">Medium Risk</span>
                        <span className="text-orange-500 font-bold">45%</span>
                    </div>
                    <Progress value={45} className="h-2 bg-orange-100 [&>div]:bg-orange-500" />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium">Low Risk</span>
                        <span className="text-green-500 font-bold">43%</span>
                    </div>
                    <Progress value={43} className="h-2 bg-green-100 [&>div]:bg-green-500" />
                </div>
            </CardContent>
        </Card>
    )
}
