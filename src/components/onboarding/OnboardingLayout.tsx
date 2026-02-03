'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface OnboardingLayoutProps {
    children: React.ReactNode;
    sidebarContent?: React.ReactNode; // Optional custom sidebar content
}

export function OnboardingLayout({ children, sidebarContent }: OnboardingLayoutProps) {
    return (
        <div className="flex min-h-screen w-full overflow-hidden bg-white font-sans">
            {/* Left Sidebar - Solid Blue */}
            <div className="hidden lg:flex w-[40%] min-w-[400px] flex-col bg-[#002A52] relative overflow-hidden p-12 text-white justify-center">
                {sidebarContent ? (
                    sidebarContent
                ) : (
                    <>
                        {/* Default Content */}
                        <div className="absolute top-8 left-8">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 bg-yellow-400 transform -skew-x-12" />
                                <span className="text-2xl font-bold tracking-tight">United Fillings</span>
                            </div>
                        </div>

                        <div className="z-10 space-y-4 max-w-md">
                            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                                Let's kickstart your compliances
                            </h1>
                            <p className="text-lg text-white/80">
                                Your business compliances, simplified and sorted.
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Main Content - Right Side */}
            <main className="flex-1 flex flex-col relative overflow-y-auto bg-white">
                {/* Skip Link - Only show if we are NOT in the final success state? 
                   Actually layouts usually persist, let's keep it. 
                   If the user wants to remove it for a specific step, we can handle via props later if needed. */}
                <div className="absolute top-8 right-8 z-20">
                    <Link href="/calendar" className="text-[#0070f3] text-sm font-semibold hover:underline">
                        Skip to dashboard
                    </Link>
                </div>

                <div className="flex-1 w-full max-w-2xl mx-auto p-6 md:p-12 lg:p-16 flex flex-col justify-center">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                        className="w-full"
                    >
                        {children}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
