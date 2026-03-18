"use client"

import { useState, useEffect } from "react"
import { useService } from "@/context/service-context"
import { useAuth } from "@/context/auth-context"
import { Tabs,  TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from "lucide-react"
import { ServiceSheet } from "@/components/services/service-sheet"
import { Service } from "@/services/serviceService"
import { Skeleton } from "@/components/ui/skeleton"

const CATEGORIES = ["All", "Licenses", "Trademarks", "Company Changes", "Taxation"]

export default function ServicesPage() {
    const { services, loading: isLoading, pagination, setPage } = useService();
    const { updateOnboardingTask, user } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    useEffect(() => {
        if (user?.onboardingTasks && !user.onboardingTasks.exploreServices) {
            updateOnboardingTask('exploreServices');
        }
    }, [updateOnboardingTask, user?.onboardingTasks]);

    const displayServices = services;

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
                                onClick={() => setSelectedService(service)}
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

                {/* Pagination Controls */}
                {!isLoading && pagination.totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white rounded-lg shadow-sm">
                        <p className="text-sm text-slate-500">
                            Showing page <span className="font-medium text-slate-900">{pagination.currentPage}</span> of <span className="font-medium text-slate-900">{pagination.totalPages}</span>
                            <span className="ml-1">({pagination.totalDocs} total records)</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(Math.max(1, pagination.currentPage - 1))}
                                disabled={pagination.currentPage === 1}
                                className="h-8 gap-1"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(Math.min(pagination.totalPages, pagination.currentPage + 1))}
                                disabled={pagination.currentPage === pagination.totalPages}
                                className="h-8 gap-1"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Tabs>

            <ServiceSheet
                service={selectedService}
                open={!!selectedService}
                onOpenChange={(open) => !open && setSelectedService(null)}
            />
        </div>
    )
}
