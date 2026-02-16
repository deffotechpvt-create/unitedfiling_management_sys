"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { CompanyProvider } from "@/context/company-context"
import { AuthProvider } from "@/context/auth-context"
import { Toaster } from "@/components/ui/sonner"

import { SuperAdminProvider } from "@/context/super-admin-context"
import { ClientProvider } from "@/context/client-context"
import { ComplianceProvider } from "@/context/compliance-context"
import { ServiceProvider } from "@/context/service-context"

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <CompanyProvider>
                    <SuperAdminProvider>
                        <ClientProvider>
                            <ComplianceProvider>
                                <ServiceProvider>
                                    {children}
                                    <Toaster />
                                </ServiceProvider>
                            </ComplianceProvider>
                        </ClientProvider>
                    </SuperAdminProvider>
                </CompanyProvider>
            </AuthProvider>
        </QueryClientProvider>
    )
}
