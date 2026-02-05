"use client";

import { CheckCircle2, XCircle } from "lucide-react";

export interface PasswordValidation {
    isValid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    score: number;
    checks: {
        minLength: boolean;
        hasUppercase: boolean;
        hasLowercase: boolean;
        hasNumber: boolean;
        hasSpecialChar: boolean;
    };
    errors: string[];
}

export const validatePassword = (password: string): PasswordValidation => {
    const checks = {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const errors: string[] = [];
    if (!checks.minLength) errors.push('At least 8 characters');
    if (!checks.hasUppercase) errors.push('At least 1 uppercase letter (A-Z)');
    if (!checks.hasLowercase) errors.push('At least 1 lowercase letter (a-z)');
    if (!checks.hasNumber) errors.push('At least 1 number (0-9)');
    if (!checks.hasSpecialChar) errors.push('At least 1 special character (!@#$%^&*...)');

    let score = 0;
    if (checks.minLength) score += 20;
    if (checks.hasUppercase) score += 20;
    if (checks.hasLowercase) score += 20;
    if (checks.hasNumber) score += 20;
    if (checks.hasSpecialChar) score += 20;

    let strength: 'weak' | 'medium' | 'strong';
    if (score < 60) {
        strength = 'weak';
    } else if (score < 100) {
        strength = 'medium';
    } else {
        strength = 'strong';
    }

    const isValid = Object.values(checks).every(Boolean);

    return {
        isValid,
        strength,
        score,
        checks,
        errors,
    };
};

export const getStrengthColor = (strength: 'weak' | 'medium' | 'strong'): string => {
    switch (strength) {
        case 'weak':
            return 'bg-red-500';
        case 'medium':
            return 'bg-yellow-500';
        case 'strong':
            return 'bg-green-500';
        default:
            return 'bg-gray-300';
    }
};

export const getStrengthText = (strength: 'weak' | 'medium' | 'strong'): string => {
    switch (strength) {
        case 'weak':
            return 'Weak';
        case 'medium':
            return 'Medium';
        case 'strong':
            return 'Strong';
        default:
            return '';
    }
};

interface PasswordStrengthIndicatorProps {
    password: string;
    showRules?: boolean;
    compact?: boolean; // ✅ New compact mode
}

export function PasswordStrengthIndicator({
    password,
    compact = false
}: PasswordStrengthIndicatorProps) {
    const validation: PasswordValidation = validatePassword(password);

    if (!password) return null;

    // ✅ Compact Mode (Minimal UI)
    if (compact) {
        return (
            <div className="space-y-1.5">
                {/* Compact Strength Bar */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                            className={`h-1.5 transition-all duration-300 ${getStrengthColor(validation.strength)}`}
                            style={{ width: `${validation.score}%` }}
                        />
                    </div>
                    <span className={`text-xs font-medium ${validation.strength === 'weak' ? 'text-red-600' :
                        validation.strength === 'medium' ? 'text-yellow-600' :
                            'text-green-600'
                        }`}>
                        {getStrengthText(validation.strength)}
                    </span>
                </div>

                {/* Compact Requirements - Horizontal Icons */}
                <div className="flex items-center gap-1.5">
                    <RequirementIcon met={validation.checks.minLength} tooltip="8+ chars" />
                    <RequirementIcon met={validation.checks.hasUppercase} tooltip="1 uppercase (A-Z)" />
                    <RequirementIcon met={validation.checks.hasLowercase} tooltip="1 lowercase (a-z)" />
                    <RequirementIcon met={validation.checks.hasNumber} tooltip="1 number (0-9)" />
                    <RequirementIcon met={validation.checks.hasSpecialChar} tooltip="1 special (!@#$...)" />
                </div>
            </div>
        );
    }
}

// ✅ Compact Requirement Icon (Horizontal)
function RequirementIcon({ met, tooltip }: { met: boolean; tooltip: string }) {
    return (
        <div className="group relative">
            {met ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
            ) : (
                <XCircle className="h-3.5 w-3.5 text-slate-300" />
            )}
            {/* Tooltip */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {tooltip}
            </span>
        </div>
    );
}