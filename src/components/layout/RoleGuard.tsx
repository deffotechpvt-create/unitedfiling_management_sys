"use client";

import { useAuth } from "@/context/auth-context";
import { isRoleAllowed } from "@/lib/roles";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  if (!isRoleAllowed(user.role, allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
