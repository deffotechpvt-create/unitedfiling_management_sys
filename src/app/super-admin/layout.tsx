"use client"

import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, loading, isAuthenticated } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && (!isAuthenticated || user?.role !== "SUPER_ADMIN")) {
            router.push("/")
        }
    }, [user, loading, isAuthenticated, router])

    if (loading || user?.role !== "SUPER_ADMIN") {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    return (
        <>
            {children}
        </>
    )
}
