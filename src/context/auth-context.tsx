"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

export type UserRole = "ADMIN" | "USER" | "SUPER_ADMIN"

interface User {
    name: string
    role: UserRole
    email: string
}

interface AuthContextType {
    user: User | null
    login: (role: UserRole) => void
    logout: () => void
    isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const router = useRouter()
    const pathname = usePathname()

    // Initial mock check (persisted login could be added here)
    useEffect(() => {
        const storedRole = localStorage.getItem("united_fillings_role") as UserRole
        if (storedRole) {
            let name = "John Doe";
            let email = "user@unitedfillings.com";

            if (storedRole === "ADMIN") {
                name = "Admin User";
                email = "admin@unitedfillings.com";
            } else if (storedRole === "SUPER_ADMIN") {
                name = "Super Admin";
                email = "superadmin@unitedfillings.com";
            }

            setUser({
                name,
                role: storedRole,
                email
            })
        }
    }, [])

    const login = (role: UserRole) => {
        localStorage.setItem("united_fillings_role", role)

        let name = "John Doe";
        let email = "user@unitedfillings.com";

        if (role === "ADMIN") {
            name = "Admin User";
            email = "admin@unitedfillings.com";
        } else if (role === "SUPER_ADMIN") {
            name = "Super Admin";
            email = "superadmin@unitedfillings.com";
        }

        setUser({
            name,
            role: role,
            email
        })
        router.push("/")
    }

    const logout = () => {
        localStorage.removeItem("united_fillings_role")
        setUser(null)
        router.push("/login")
    }

    // Redirect to login if accessing protected routes without user
    useEffect(() => {
        if (!user && !localStorage.getItem("united_fillings_role") && pathname !== "/login") {
            router.push("/login")
        }
    }, [user, pathname, router])

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within a AuthProvider")
    }
    return context
}
