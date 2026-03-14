"use client"

import { Button } from "@/components/ui/button"
import { Bell, CheckCircle2,Receipt } from "lucide-react"

export default function BillingPage() {
    return (
        <div className="space-y-6 pb-20">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">Billing</h1>

            <div className="bg-white rounded-xl border border-slate-200 p-12 min-h-[600px] flex flex-col items-center justify-center text-center max-w-5xl mx-auto">

                {/* Illustration Placeholder - Using a composite of icons to represent the invoice graphic */}
                <div className="mb-8 relative">
                    <div className="h-24 w-20 bg-slate-100 rounded-lg border-2 border-slate-200 transform -rotate-6 flex flex-col items-center p-2 shadow-sm">
                        <div className="h-2 w-12 bg-slate-300 rounded mb-2" />
                        <div className="h-1 w-10 bg-slate-200 rounded mb-1" />
                        <div className="h-1 w-10 bg-slate-200 rounded mb-1" />
                        <div className="h-1 w-8 bg-slate-200 rounded mb-1" />
                    </div>
                    <div className="h-24 w-20 bg-white rounded-lg border-2 border-slate-200 absolute top-0 left-4 rotate-6 flex flex-col items-center justify-center shadow-md">
                        <Receipt className="h-10 w-10 text-blue-500" />
                        <span className="text-xs font-bold text-slate-900 mt-1">$ Invoice</span>
                    </div>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                    Billing & Invoicing: Coming Soon!
                </h2>
                <h3 className="text-lg font-medium text-slate-700 mb-6">
                    Effortless Billing for Smarter Businesses
                </h3>

                <p className="max-w-2xl text-slate-500 mb-10 leading-relaxed">
                    Managing your finances is about to get a whole lot easier. We are building a powerful Billing Module designed to take the manual effort out of your invoicing and payments.
                </p>

                <div className="bg-blue-50/50 rounded-xl p-8 max-w-3xl w-full border border-blue-100 text-left mb-10">
                    <h4 className="font-semibold text-slate-900 mb-6">What's in it for you?</h4>
                    <div className="grid md:grid-cols-1 gap-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-slate-900 shrink-0 mt-0.5" />
                            <p className="text-slate-700 text-sm"><span className="font-semibold text-slate-900">Instant Invoicing:</span> Create and send GST-compliant invoices in seconds.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-slate-900 shrink-0 mt-0.5" />
                            <p className="text-slate-700 text-sm"><span className="font-semibold text-slate-900">Automated Follow-ups:</span> Get paid faster with smart payment reminders.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-slate-900 shrink-0 mt-0.5" />
                            <p className="text-slate-700 text-sm"><span className="font-semibold text-slate-900">Unified Finance Hub:</span> Track all your receivables, payables, and GST data in one central dashboard.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-slate-900 shrink-0 mt-0.5" />
                            <p className="text-slate-700 text-sm"><span className="font-semibold text-slate-900">Real-time Analytics:</span> Get instant insights into your cash flow and financial health.</p>
                        </div>
                    </div>
                </div>

                <Button className="bg-[#002A52] hover:bg-[#001f3f] text-white px-8 py-6 h-auto text-base">
                    <Bell className="mr-2 h-5 w-5" />
                    Notify me when it's ready
                </Button>
            </div>
        </div>
    )
}
