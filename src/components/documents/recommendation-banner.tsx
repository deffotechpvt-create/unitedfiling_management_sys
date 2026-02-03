"use client"

import { ArrowRight, FileText, Shield, Handshake } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function RecommendationBanner() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border bg-blue-50 p-4 text-blue-900">
                <div className="flex items-center gap-2 font-medium">
                    <FileText className="h-5 w-5" />
                    Need a legal agreement? Protect your business with our expert-drafted contracts
                </div>
                <Button variant="link" className="text-blue-700 font-semibold">
                    View all
                </Button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2">
                {/* Card 1: NDA */}
                <Card className="min-w-[300px] flex-1 p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start gap-3">
                        <div className="bg-blue-100 p-2 rounded-md text-blue-700 mt-1">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900">NDA</h3>
                            <p className="text-xs text-slate-500 mt-1">To protect confidential business information</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-400">
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </Card>

                {/* Card 2: MSA */}
                <Card className="min-w-[300px] flex-1 p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start gap-3">
                        <div className="bg-blue-100 p-2 rounded-md text-blue-700 mt-1">
                            <Handshake className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900">Master Service Agreement</h3>
                            <p className="text-xs text-slate-500 mt-1">To create a flexible contract for services</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-400">
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </Card>

                {/* Card 3: Franchise Agreement */}
                <Card className="min-w-[300px] flex-1 p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start gap-3">
                        <div className="bg-blue-100 p-2 rounded-md text-blue-700 mt-1">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900">Franchise Agreement</h3>
                            <p className="text-xs text-slate-500 mt-1">To formalize a franchise relationship</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-400">
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </Card>
            </div>
        </div>
    )
}
