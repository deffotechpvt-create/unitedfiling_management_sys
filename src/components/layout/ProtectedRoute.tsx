"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isRoleAllowed, ROLES } from "@/lib/roles";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectPath?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectPath = "/"
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user && !isRoleAllowed(user.role, allowedRoles)) {
        // Dynamic redirection based on role
        if (user.role === ROLES.SUPER_ADMIN) {
          router.push("/super-admin");
        } else {
          router.push(redirectPath);
        }
      }
    }
  }, [loading, isAuthenticated, user, allowedRoles, router, redirectPath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-lg">Checking permissions...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !isRoleAllowed(user.role, allowedRoles)) {
    return null;
  }

  return <>{children}</>;
}
