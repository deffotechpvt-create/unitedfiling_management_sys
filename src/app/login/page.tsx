"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { ShieldCheck, User, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
    const { login, register, loading, error } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [formError, setFormError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        try {
            if (isSignUp) {
                // Register
                await register({
                    name,
                    email,
                    password,
                    phone: phone || undefined,
                });
                // Success - user will be redirected to login by context
            } else {
                // Login
                await login({
                    email,
                    password,
                });
                // Success - user will be redirected to dashboard by context
            }
        } catch (err: any) {
            setFormError(err.message);
        }
    };

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
                        "United Fillings has completely transformed how we handle our corporate compliance. It's efficient,
                        transparent, and significantly reduces our legal risk."
                    </blockquote>
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center font-bold">VS</div>
                        <div>
                            <div className="font-semibold">Vikram Singh</div>
                            <div className="text-sm text-slate-400">CEO, TechStart Solutions</div>
                        </div>
                    </div>
                </div>

                <div className="text-sm text-slate-400">&copy; 2024 United Fillings Corp. All rights reserved.</div>
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

                    {/* Error Display */}
                    {(formError || error) && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <p className="text-sm">{formError || error}</p>
                        </div>
                    )}

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
                                    disabled={loading}
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
                                disabled={loading}
                            />
                        </div>

                        {isSignUp && (
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone (Optional)</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="9876543210"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        )}

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
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                minLength={6}
                            />
                            {isSignUp && (
                                <p className="text-xs text-slate-500">Password must be at least 6 characters</p>
                            )}
                        </div>

                        <Button className="w-full bg-slate-900 hover:bg-slate-800" type="submit" disabled={loading}>
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    {isSignUp ? "Creating account..." : "Signing in..."}
                                </span>
                            ) : (
                                <>
                                    {isSignUp ? "Sign Up" : "Sign In"}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-slate-50 px-2 text-muted-foreground">Quick Test Login</span>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Button
                            variant="outline"
                            onClick={async () => {
                                setFormError("");
                                try {
                                    await login({ email: "superadmin@unitedfillings.com", password: "SuperSecure123!" });
                                } catch (err: any) {
                                    setFormError(err.message);
                                }
                            }}
                            disabled={loading}
                        >
                            <ShieldCheck className="mr-2 h-4 w-4 text-purple-600" />
                            Test Super Admin Login
                        </Button>

                        <Button
                            variant="outline"
                            onClick={async () => {
                                setFormError("");
                                try {
                                    await login({ email: "admin@example.com", password: "admin123" });
                                } catch (err: any) {
                                    setFormError(err.message);
                                }
                            }}
                            disabled={loading}
                        >
                            <ShieldCheck className="mr-2 h-4 w-4 text-blue-600" />
                            Test Admin Login
                        </Button>

                        <Button
                            variant="outline"
                            onClick={async () => {
                                setFormError("");
                                try {
                                    await login({ email: "john@example.com", password: "password123" });
                                } catch (err: any) {
                                    setFormError(err.message);
                                }
                            }}
                            disabled={loading}
                        >
                            <User className="mr-2 h-4 w-4 text-green-600" />
                            Test User Login
                        </Button>
                    </div>


                    <div className="text-center text-sm text-slate-500 mt-4">
                        {isSignUp ? "Already have an account? " : "Don't have an account? "}
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setFormError("");
                            }}
                            className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
                            disabled={loading}
                        >
                            {isSignUp ? "Sign In" : "Sign Up"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
