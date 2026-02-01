"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FileText, ShoppingBag, ShieldCheck, Settings, Menu, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/auth-context"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Services", href: "/services", icon: ShoppingBag },
    { name: "Documents", href: "/documents", icon: FileText },
    { name: "Compliances", href: "/compliances", icon: ShieldCheck },
    { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()
    const { user, logout } = useAuth()
    const [open, setOpen] = useState(false)

    // Don't render sidebar on login page
    if (pathname === "/login") return null

    const NavContent = () => (
        <div className="flex h-full flex-col bg-slate-900 text-white">
            <div className="flex h-16 items-center px-6 border-b border-slate-800">
                <span className="text-2xl font-bold tracking-tight text-white">United Fillings</span>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-slate-800 text-white"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                                    isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                                )}
                            />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            <div className="border-t border-slate-800 p-4">
                <div className="flex items-center">
                    <Avatar className="h-9 w-9 border border-slate-600">
                        <AvatarImage src="" alt="User" />
                        <AvatarFallback className="bg-slate-700 text-xs">
                            {user?.name.slice(0, 2).toUpperCase() || "UF"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="ml-3 truncate max-w-[120px]">
                        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                        <p className="text-xs text-slate-400">{user?.role === "ADMIN" ? "Administrator" : "Business Owner"}</p>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
                    {user?.role === "USER" && (
                        <>
                            <button className="hover:text-white text-left p-1 rounded hover:bg-slate-800 transition-colors">My Business</button>
                            <button className="hover:text-white text-left p-1 rounded hover:bg-slate-800 transition-colors">Quotations</button>
                        </>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-4 justify-start text-red-400 hover:text-red-300 hover:bg-slate-800"
                    onClick={logout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    )

    return (
        <>
            {/* Desktop Sidebar - Hidden on Mobile */}
            <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-800">
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
                    <SheetContent side="left" className="p-0 border-r-slate-800 bg-slate-900 w-64">
                        <NavContent />
                    </SheetContent>
                </Sheet>
            </div>
        </>
    )
}
