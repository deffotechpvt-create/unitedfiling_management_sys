"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import confetti from "canvas-confetti"

export default function CheckoutPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [isProcessing, setIsProcessing] = useState(false)

    const handlePayment = () => {
        setIsProcessing(true)
        setTimeout(() => {
            setIsProcessing(false)
            setStep(3)
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            })
        }, 2000)
    }

    return (
        <div className="container mx-auto max-w-2xl py-10 px-4 space-y-8">
            <div className="flex items-center justify-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>1</div>
                <div className="h-1 w-12 bg-slate-200" />
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>2</div>
            </div>

            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Details</CardTitle>
                        <CardDescription>Enter your details to proceed with the service.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First name</Label>
                                <Input id="firstName" placeholder="John" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last name</Label>
                                <Input id="lastName" placeholder="Doe" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="john@example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" type="tel" placeholder="+91 98765 43210" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={() => setStep(2)}>Continue to Payment</Button>
                    </CardFooter>
                </Card>
            )}

            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Payment</CardTitle>
                        <CardDescription>Review your order and pay securely.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-medium text-slate-900">Professional Service Fee</p>
                                <p className="text-sm text-slate-500">Includes Govt Fees & Taxes</p>
                            </div>
                            <span className="font-bold text-lg">₹14,999</span>
                        </div>
                        <Separator />
                        <div className="space-y-4">
                            <div className="flex gap-4 p-4 border rounded-lg cursor-pointer hover:border-slate-400 transition-colors">
                                <div className="h-4 w-4 rounded-full border border-slate-400 mt-1" />
                                <div>
                                    <p className="font-medium">Credit / Debit Card</p>
                                    <p className="text-sm text-slate-500">Visa, Mastercard, RuPay</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 border rounded-lg cursor-pointer hover:border-slate-400 transition-colors">
                                <div className="h-4 w-4 rounded-full border border-slate-400 mt-1" />
                                <div>
                                    <p className="font-medium">UPI / Netbanking</p>
                                    <p className="text-sm text-slate-500">Google Pay, PhonePe, Razorpay</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={handlePayment} disabled={isProcessing}>
                            {isProcessing ? "Processing..." : "Pay ₹14,999"}
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {step === 3 && (
                <Card className="text-center py-10">
                    <CardContent className="flex flex-col items-center space-y-4">
                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Payment Successful!</h2>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            Your service request has been initiated. Our expert will contact you shortly to collect the required documents.
                        </p>
                        <Button onClick={() => router.push("/")} className="mt-4">
                            Go to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
