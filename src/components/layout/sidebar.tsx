"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FileText, ShoppingBag, ShieldCheck, Settings, Menu, LogOut, Calendar, Users, Circle, HelpCircle, Building2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/auth-context"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"
import { GetStartedGuide } from "@/components/layout/get-started-guide"



export function Sidebar() {
    const pathname = usePathname()
    const { user, logout } = useAuth()
    const [open, setOpen] = useState(false)
    const [showGetStarted, setShowGetStarted] = useState(false)
    const getStartedRef = useRef<HTMLDivElement>(null)

    // Don't render sidebar on login page
    if (pathname === "/login") return null
    if (pathname === "/onboarding") return null

    // Click outside to close get started
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (getStartedRef.current && !getStartedRef.current.contains(event.target as Node)) {
                setShowGetStarted(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [getStartedRef])

    // Navigation Items based on Role
    const getNavigation = () => {
        if (!user) return []

        switch (user.role) {
            case "SUPER_ADMIN":
                return [
                    { name: "Global Dashboard", href: "/", icon: LayoutDashboard },
                    { name: "Client List", href: "/super-admin/clients", icon: Building2 },
                    { name: "Admin & User Management", href: "/super-admin/admins", icon: Users },
                    { name: "Documents", href: "/documents", icon: FileText },
                    { name: "Reports", href: "/reports", icon: FileText },
                    // { name: "Audit Logs", href: "/audit", icon: FileText },
                ]
            case "ADMIN":
                return [
                    { name: "Dashboard", href: "/", icon: LayoutDashboard },
                    { name: "Manage Clients", href: "/admin/clients", icon: Users },
                    { name: "Manage Companies", href: "/admin/companies", icon: Building2 },
                    { name: "Tasks", href: "/compliances", icon: ShieldCheck }, // Reusing compliances for tasks
                    { name: "Calendar", href: "/calendar", icon: Calendar },
                    { name: "Documents", href: "/documents", icon: FileText },
                    { name: "Reports", href: "/reports", icon: FileText },
                ]
            case "USER":
            default:
                return [
                    // { name: "Home", href: "/", icon: LayoutDashboard }, // User Dashboard removed
                    { name: "Compliances", href: "/compliances", icon: ShieldCheck },
                    { name: "Billing", href: "/billing", icon: ShoppingBag, badge: "COMING SOON" },
                    { name: "Service Hub", href: "/services", icon: ShoppingBag, star: true },
                    { name: "Calendar", href: "/calendar", icon: Calendar },
                    { name: "Documents", href: "/documents", icon: FileText },
                    { name: "Reports", href: "/reports", icon: FileText },
                    { name: "Consult", href: "/consult", icon: Users },
                    { name: "Users & Roles", href: "/users", icon: Users },
                ]
        }
    }

    const navigationItems = getNavigation()


    const NavContent = () => (
        <div className="flex h-full flex-col bg-[#001f3f] text-white"> {/* Updated to Dark Blue */}
            <div className="flex h-16 items-center px-6 pt-4 mb-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-green-500 transform -skew-x-12" />
                    <span className="text-xl font-bold tracking-tight text-white">United Fillings</span>
                </div>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigationItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                                "group flex items-center px-3 py-3 text-sm font-medium transition-colors relative",
                                isActive
                                    ? "bg-white/10 text-white rounded-r-full border-l-4 border-green-500"
                                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                                    isActive ? "text-green-500" : "text-slate-400 group-hover:text-white"
                                )}
                            />
                            {item.name}

                            {/* @ts-ignore */}
                            {item.badge && (
                                <span className="ml-auto bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                                    {/* @ts-ignore */}
                                    {item.badge}
                                </span>
                            )}
                            {/* @ts-ignore */}
                            {item.star && (
                                <span className="ml-auto text-green-400">
                                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 bg-[#001f3f]" ref={getStartedRef}>
                <div className="relative">
                    {showGetStarted && <GetStartedGuide />}

                    <button
                        onClick={() => setShowGetStarted(!showGetStarted)}
                        className="w-full flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 p-3 rounded-lg border border-slate-700 transition-all mb-2 group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative h-5 w-5 flex items-center justify-center">
                                <div className="absolute inset-0 border-2 border-slate-500 rounded-full border-t-green-500 -rotate-45" />
                            </div>
                            <span className="text-sm font-medium">Get Started</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            1/4 <span className="text-[10px]">&gt;</span>
                        </div>
                    </button>

                    {/* Logout Button for visual completeness in this area or keep in user menu */}
                    <div className="mt-2 pt-2 border-t border-slate-800 flex items-center px-2 py-2">
                        <Avatar className="h-8 w-8 mr-3">
                            <AvatarFallback className="bg-slate-700 text-xs">{user?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate text-white">{user?.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{user?.role === "SUPER_ADMIN" ? "Super Admin" : user?.role === "ADMIN" ? "Admin" : "Client"}</p>
                        </div>
                        <button onClick={logout} className="text-slate-400 hover:text-white">
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )

    return (
        <>
            {/* Desktop Sidebar - Hidden on Mobile */}
            <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-800 z-40">
                <NavContent />
            </div>

            {/* Mobile Trigger & Sheet - Visible on Mobile */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="bg-slate-900 border-slate-700 text-white hover:bg-slate-800 hover:text-white">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 border-r-slate-800 bg-[#001f3f] w-64">
                        <NavContent />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    )
}
