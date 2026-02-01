"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"
import { ShieldCheck, User, Building2, ArrowRight } from "lucide-react"

export default function LoginPage() {
    const { login } = useAuth()
    const [isSignUp, setIsSignUp] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Mock authentication
        // In a real app, we would validate credentials here
        if (email.includes("admin")) {
            login("ADMIN")
        } else {
            login("USER")
        }
    }

    return (
        <div className="w-full h-screen lg:grid lg:grid-cols-2">
            {/* Left Side - Visuals */}
            <div className="hidden bg-slate-900 lg:flex flex-col justify-between p-10 text-white">
                <div className="flex items-center gap-2 font-bold text-2xl">
                    <ShieldCheck className="h-8 w-8 text-blue-500" />
                    <span>United Fillings</span>
                </div>

                <div className="space-y-6 max-w-lg">
                    <blockquote className="text-2xl font-medium leading-relaxed">
                        "United Fillings has completely transformed how we handle our corporate compliance. It's efficient, transparent, and significantly reduces our legal risk."
                    </blockquote>
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center font-bold">
                            VS
                        </div>
                        <div>
                            <div className="font-semibold">Vikram Singh</div>
                            <div className="text-sm text-slate-400">CEO, TechStart Solutions</div>
                        </div>
                    </div>
                </div>

                <div className="text-sm text-slate-400">
                    &copy; 2024 United Fillings Corp. All rights reserved.
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex items-center justify-center py-12 px-6 lg:px-20 bg-slate-50">
                <div className="mx-auto grid w-full max-w-[400px] gap-6">
                    <div className="grid gap-2 text-center lg:text-left">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            {isSignUp ? "Create an account" : "Welcome back"}
                        </h1>
                        <p className="text-slate-500">
                            {isSignUp
                                ? "Enter your details below to create your account"
                                : "Enter your credentials to access your dashboard"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="grid gap-4">
                        {isSignUp && (
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required={isSignUp}
                                />
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                {!isSignUp && (
                                    <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                                        Forgot password?
                                    </a>
                                )}
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button className="w-full bg-slate-900 hover:bg-slate-800" type="submit">
                            {isSignUp ? "Sign Up" : "Sign In"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-slate-50 px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" onClick={() => login("ADMIN")}>
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Admin Demo
                        </Button>
                        <Button variant="outline" onClick={() => login("USER")}>
                            <User className="mr-2 h-4 w-4" />
                            User Demo
                        </Button>
                    </div>

                    <div className="text-center text-sm text-slate-500 mt-4">
                        {isSignUp ? "Already have an account? " : "Don't have an account? "}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
                        >
                            {isSignUp ? "Sign In" : "Sign Up"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
