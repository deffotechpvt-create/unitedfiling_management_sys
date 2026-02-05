// context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/services/authService";
import { User, LoginCredentials, RegisterData, AuthContextType } from "@/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    // Check authentication on mount
    useEffect(() => {
        checkAuth();
    }, []);

    // Redirect to login if not authenticated (except on login/register pages)
    useEffect(() => {
        const publicRoutes = ["/login", "/register"];
        if (!loading && !user && !publicRoutes.includes(pathname)) {
            router.push("/login");
        }
    }, [user, loading, pathname, router]);

    const checkAuth = async () => {
        try {
            setLoading(true);
            const response = await authService.getMe();

            if (response.success && response.user) {
                setUser(response.user);
            } else {
                setUser(null);
            }
        } catch (err) {
            console.log("Not authenticated");
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials: LoginCredentials) => {
        try {
            setError(null);
            setLoading(true);

            const response = await authService.login(credentials);

            if (response.success && response.user) {
                setUser(response.user);
                router.push("/"); // Redirect to dashboard/home
            } else {
                throw new Error(response.message || "Login failed");
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Login failed";
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const register = async (data: RegisterData) => {
        try {
            setError(null);
            setLoading(true);

            const response = await authService.register(data);

            if (response.success) {
                // After registration, redirect to login
                router.push("/login");
            } else {
                throw new Error(response.message || "Registration failed");
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Registration failed";
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            setLoading(true);
            await authService.logout();
            setUser(null);
            router.push("/login");
        } catch (err: any) {
            console.error("Logout error:", err);
            // Force logout even if API fails
            setUser(null);
            router.push("/login");
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (data: Partial<User>) => {
        try {
            setError(null);
            setLoading(true);

            const response = await authService.updateProfile(data);

            if (response.success && response.user) {
                setUser(response.user);
            } else {
                throw new Error(response.message || "Update failed");
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "Update failed";
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const value: AuthContextType = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!user,
    };

    // Show loading screen while checking auth
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
