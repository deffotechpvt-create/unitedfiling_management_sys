"use client"

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CheckCircle2, FileText, CreditCard } from "lucide-react"
import { Service } from "@/services/serviceService"

interface ServiceSheetProps {
    service: Service | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ServiceSheet({ service, open, onOpenChange }: ServiceSheetProps) {
    if (!service) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-[540px] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-2xl">{service.title}</SheetTitle>
                    <SheetDescription>{service.description}</SheetDescription>
                </SheetHeader>

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="process">Process</TabsTrigger>
                        <TabsTrigger value="pricing">Pricing</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4 mt-4">
                        <h3 className="font-semibold text-lg">Key Benefits</h3>
                        <ul className="space-y-3">
                            {service.benefits?.map((benefit, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    <span>{benefit}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-sm text-muted-foreground mt-4">
                            Get started today to ensure your business remains compliant and protected.
                        </p>
                    </TabsContent>

                    <TabsContent value="process" className="space-y-4 mt-4">
                        <div className="relative border-l border-slate-200 ml-3 space-y-6 pb-4">
                            {service.processSteps?.map((step, i) => (
                                <div key={i} className="relative pl-6">
                                    <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border border-white bg-slate-300 ring-4 ring-white" />
                                    <h4 className="font-medium text-slate-900">{step.title}</h4>
                                    <p className="text-sm text-slate-500">{step.description}</p>
                                </div>
                            ))}
                        </div>
                        <div className="rounded-lg bg-blue-50 p-4 flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <p className="text-sm text-blue-700">Documents required will be requested after payment.</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="pricing" className="space-y-4 mt-4">
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                            <div className="flex flex-col space-y-1.5 pb-4">
                                <h3 className="font-semibold leading-none tracking-tight">Standard Package</h3>
                                <p className="text-sm text-muted-foreground">Everything you need to get started.</p>
                            </div>
                            <div className="flex items-baseline justify-center pb-4">
                                <span className="text-3xl font-bold">{service.price}</span>
                                <span className="text-muted-foreground ml-1">/ entity</span>
                            </div>
                            <Button className="w-full" size="lg" asChild>
                                <a href={`/services/${service.id || service._id}/checkout`}>
                                    Get Started <CreditCard className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    )
}
