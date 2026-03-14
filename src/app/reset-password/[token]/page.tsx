"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { ShieldCheck, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { PasswordStrengthIndicator, validatePassword } from "@/components/ui/PasswordStrengthIndicator";
import { toast } from "sonner";

export default function ResetPasswordPage() {
    const params = useParams();
    const router = useRouter();
    const { resetPassword, loading, error } = useAuth();
    
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState("");
    const [success, setSuccess] = useState(false);

    const token = params.token as string;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        if (password !== confirmPassword) {
            setFormError("Passwords do not match");
            return;
        }

        const validation = validatePassword(password);
        if (!validation.isValid) {
            setFormError("Password does not meet security requirements");
            return;
        }

        try {
            await resetPassword(token, password);
            setSuccess(true);
            toast.success("Password reset successful!", {
                description: "You can now log in with your new password.",
            });
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (err: any) {
            setFormError(err.message);
            toast.error("Reset failed", {
                description: err.message || "Could not reset your password.",
            });
        }
    };

    const isPasswordValid = password ? validatePassword(password).isValid : false;

    return (
        <div className="w-full h-screen flex items-center justify-center p-6 bg-slate-50">
            <div className="mx-auto grid w-full max-w-[400px] gap-6">
                <div className="flex flex-col items-center gap-2 text-center lg:items-start lg:text-left">
                    <div className="flex items-center gap-2 font-bold text-2xl mb-4">
                        <ShieldCheck className="h-8 w-8 text-blue-500" />
                        <span>United Fillings</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        {success ? "Password Reset" : "Create new password"}
                    </h1>
                    <p className="text-slate-500">
                        {success 
                            ? "Your password has been successfully reset. Redirecting to login..." 
                            : "Enter your new password below to reset your account password."}
                    </p>
                </div>

                {success ? (
                    <div className="flex flex-col items-center gap-4 p-8 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                        <Button 
                            className="w-full mt-4 bg-slate-900 hover:bg-slate-800"
                            onClick={() => router.push("/login")}
                        >
                            Back to Login
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Error Display */}
                        {(formError || error) && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <p className="text-sm">{formError || error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="password">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                        disabled={loading}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {password && (
                                    <PasswordStrengthIndicator password={password} compact={true} showRules={true} />
                                ) }
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <Button
                                className="w-full bg-slate-900 hover:bg-slate-800 mt-2"
                                type="submit"
                                disabled={loading || !isPasswordValid || password !== confirmPassword}
                            >
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
                                        Resetting...
                                    </span>
                                ) : (
                                    <>
                                        Reset Password
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="text-center text-sm">
                            <button
                                onClick={() => router.push("/login")}
                                className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
                                disabled={loading}
                            >
                                Wait, I remember my password
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
