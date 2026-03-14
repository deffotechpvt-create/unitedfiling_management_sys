"use client";

import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { ROLES } from "@/lib/roles";

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            {children}
        </ProtectedRoute>
    );
}
