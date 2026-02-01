"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchServices } from "@/lib/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles } from "lucide-react"
import { ServiceSheet } from "@/components/services/service-sheet"
import { Service } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"

const CATEGORIES = ["All", "Licenses", "Trademarks", "Company Changes", "Taxation"]

export default function ServicesPage() {
    const [selectedCategory, setSelectedCategory] = useState("All")
    const [selectedService, setSelectedService] = useState<Service | null>(null)

    // In a real app, query would accept category
    const { data: services, isLoading } = useQuery({
        queryKey: ["services"],
        queryFn: fetchServices
    })

    // Mock expanding the services for demo purposes since api.ts only has 2
    const displayServices = services ? [
        ...services,
        {
            id: "s3",
            title: "GST Registration",
            description: "Get your GSTIN within 7 days.",
            category: "Taxation",
            price: "₹1,499",
            benefits: ["Legal Compliance", "Input Tax Credit"],
            processSteps: [{ title: "Docs", description: "Upload PAN/Aadhaar" }, { title: "Filing", description: "Submit to Portal" }]
        },
        {
            id: "s4",
            title: "Add Director",
            description: "Appoint a new director to your company.",
            category: "Company Changes",
            price: "₹2,999",
            benefits: ["Management Expansion", "Compliance"],
            processSteps: [{ title: "DIN Application", description: "For new director" }, { title: "DIR-12", description: "File with ROC" }]
        },
        {
            id: "s5",
            title: "FSSAI License",
            description: "Food license for your food business.",
            category: "Licenses",
            price: "₹3,999",
            benefits: ["Legal Requirement", "Consumer Trust"],
            processSteps: [{ title: "Application", description: "Form A/B" }, { title: "Inspection", description: "By Food Inspector" }]
        }
    ] : []

    const filteredServices = selectedCategory === "All"
        ? displayServices
        : displayServices.filter(s => s.category === CATEGORIES.find(c => c === selectedCategory) || s.category === selectedCategory)

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Service Hub</h1>
                <p className="text-muted-foreground">Marketplace for all your legal and compliance needs.</p>
            </div>

            <Tabs defaultValue="All" value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto">
                    {CATEGORIES.map(category => (
                        <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
                    ))}
                </TabsList>

                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} className="overflow-hidden">
                                <CardHeader className="space-y-2">
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-4 w-4/5" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-24 w-full" />
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        filteredServices.map((service) => (
                            <Card
                                key={service.id}
                                className="group relative cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1"
                                onClick={() => setSelectedService(service as Service)}
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 transition-opacity group-hover:opacity-100">
                                    <ArrowRight className="h-5 w-5 text-slate-400" />
                                </div>
                                <CardHeader>
                                    <Badge variant="secondary" className="w-fit mb-2">{service.category}</Badge>
                                    <CardTitle className="text-xl">{service.title}</CardTitle>
                                    <CardDescription className="line-clamp-2">{service.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg font-bold text-slate-900">{service.price}</span>
                                        <span className="text-xs text-muted-foreground">/ starting</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-slate-50 p-4">
                                    <div className="flex items-center text-sm text-blue-600 font-medium">
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        View Details
                                    </div>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>
            </Tabs>

            <ServiceSheet
                service={selectedService}
                open={!!selectedService}
                onOpenChange={(open) => !open && setSelectedService(null)}
            />
        </div>
    )
}
