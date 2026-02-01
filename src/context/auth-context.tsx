"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

export type UserRole = "ADMIN" | "USER"

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
            setUser({
                name: storedRole === "ADMIN" ? "Admin User" : "John Doe",
                role: storedRole,
                email: storedRole === "ADMIN" ? "admin@unitedfillings.com" : "user@unitedfillings.com"
            })
        }
    }, [])

    const login = (role: UserRole) => {
        localStorage.setItem("united_fillings_role", role)
        setUser({
            name: role === "ADMIN" ? "Admin User" : "John Doe",
            role: role,
            email: role === "ADMIN" ? "admin@unitedfillings.com" : "user@unitedfillings.com"
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
