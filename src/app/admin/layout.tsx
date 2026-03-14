"use client"

import { ProtectedRoute } from "@/components/layout/ProtectedRoute"
import { ROLES } from "@/lib/roles"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Both ADMIN and SUPER_ADMIN might access admin routes just in case,
    // though SUPER_ADMIN usually operates in /super-admin
    return (
        <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
            {children}
        </ProtectedRoute>
    )
}
