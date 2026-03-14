import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { ROLES } from "@/lib/roles";

export default function UsersLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.USER]}>
            {children}
        </ProtectedRoute>
    );
}
