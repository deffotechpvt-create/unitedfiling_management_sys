"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { CheckCircle2, Loader2, AlertCircle, Building2, ChevronRight, CreditCard, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useService } from "@/context/service-context"
import { useCompany } from "@/context/company-context"
import { useAuth } from "@/context/auth-context"
import { paymentService } from "@/services/paymentService"
import { Service } from "@/services/serviceService"
import { toast } from "sonner"
import confetti from "canvas-confetti"
import { Label } from "@/components/ui/label"

declare const Razorpay: any;

export default function CheckoutPage() {
    const params = useParams()
    const router = useRouter()
    const serviceId = params.id as string
    
    const { getServiceById } = useService()
    const { companies, selectedCompany, setSelectedCompany } = useCompany()
    const { user } = useAuth()
    
    const [service, setService] = useState<Service | null>(null)
    const [loading, setLoading] = useState(true)
    const [step, setStep] = useState(1)
    const [isProcessing, setIsProcessing] = useState(false)

    useEffect(() => {
        const fetchService = async () => {
            const data = await getServiceById(serviceId)
            if (data) setService(data)
            else {
                toast.error("Service not found")
                router.push("/services")
            }
            setLoading(false)
        }
        fetchService()
    }, [serviceId, getServiceById, router])

    const handlePayment = async () => {
        if (!service || !selectedCompany || !user) {
            toast.error("Please ensure all details are selected")
            return
        }

        setIsProcessing(true)
        try {
            // 1. Create Order
            const order = await paymentService.createOrder(service._id, 'SERVICE')
            
            // 2. Open Razorpay
            const options = {
                key: order.keyId,
                amount: order.amount,
                currency: order.currency,
                name: "United Fillings",
                description: `Purchase: ${service.title}`,
                order_id: order.orderId,
                handler: async (response: any) => {
                    try {
                        const verificationData = {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            entityId: service._id,
                            entityType: 'SERVICE' as const,
                            companyId: selectedCompany._id
                        }
                        
                        await paymentService.verifyPayment(verificationData)
                        
                        setStep(3)
                        confetti({
                            particleCount: 150,
                            spread: 70,
                            origin: { y: 0.6 }
                        })
                        toast.success("Payment successful!")
                    } catch (error: any) {
                        toast.error(error.response?.data?.message || "Payment verification failed")
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone || ""
                },
                theme: {
                    color: "#001f3f"
                }
            }

            const rzp = new Razorpay(options)
            rzp.on('payment.failed', function (response: any) {
                toast.error("Payment failed: " + response.error.description)
            })
            rzp.open()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to initiate payment")
        } finally {
            setIsProcessing(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        )
    }

    if (!service) return null

    return (
        <div className="container mx-auto max-w-2xl py-10 px-4 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-slate-900">Service Checkout</h1>
                <p className="text-slate-500">Securely purchase {service.title} for your business.</p>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${step >= 1 ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200"}`}>
                    {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : "1"}
                </div>
                <div className={`h-0.5 w-12 transition-colors ${step >= 2 ? "bg-slate-900" : "bg-slate-200"}`} />
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${step >= 2 ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200"}`}>
                    {step > 2 ? <CheckCircle2 className="h-5 w-5" /> : "2"}
                </div>
            </div>

            {step === 1 && (
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            Select Your Business
                        </CardTitle>
                        <CardDescription>Which company is this service for?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {companies.length === 0 ? (
                            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex gap-3 text-orange-800">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">No business found</p>
                                    <p className="text-xs">You need to add a business before you can purchase services.</p>
                                    <Button size="sm" variant="outline" className="border-orange-300 hover:bg-orange-100" onClick={() => router.push('/onboarding')}>
                                        Add Business
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Label htmlFor="company">Registered Companies</Label>
                                <Select
                                    value={selectedCompany?._id}
                                    onValueChange={(val) => {
                                        const company = companies.find(c => c._id === val)
                                        if (company) setSelectedCompany(company)
                                    }}
                                >
                                    <SelectTrigger id="company" className="h-12">
                                        <SelectValue placeholder="Select a company" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {companies.map(company => (
                                            <SelectItem key={company._id} value={company._id}>
                                                {company.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {selectedCompany && (
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Business Preview</p>
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-slate-900">{selectedCompany.name}</span>
                                            <Badge variant="secondary" className="bg-white">{selectedCompany.registrationNumber || "No Reg #"}</Badge>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button 
                            className="w-full h-12 text-lg bg-slate-900" 
                            disabled={!selectedCompany}
                            onClick={() => setStep(2)}
                        >
                            Review & Pay <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {step === 2 && (
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <CardTitle>Review Your Order</CardTitle>
                                <CardDescription>Confirm details before payment.</CardDescription>
                            </div>
                            <Badge className="bg-blue-600">{service.category}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="p-6 space-y-6">
                            {/* Service Summary */}
                            <div className="flex justify-between items-center">
                                <div className="space-y-0.5">
                                    <p className="font-bold text-slate-900 text-lg">{service.title}</p>
                                    <p className="text-sm text-slate-500">{service.serviceType}</p>
                                </div>
                                <span className="text-2xl font-black text-slate-900">₹{service.price.toLocaleString('en-IN')}</span>
                            </div>

                            <Separator />

                            {/* Features */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">What's Included</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {service.benefits.slice(0, 3).map((benefit, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            {benefit}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            {/* Business Context */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Building2 className="h-4 w-4 text-slate-400" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-slate-900">{selectedCompany?.name}</span>
                                        <span className="text-xs text-slate-500">Business for service</span>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-blue-600 h-7" onClick={() => setStep(1)}>Change</Button>
                            </div>
                        </div>

                        {/* Trust Bar */}
                        <div className="bg-emerald-50 px-6 py-3 flex items-center gap-2 text-[11px] font-bold text-emerald-700 uppercase tracking-widest">
                            <Sparkles className="h-3 w-3" />
                            Secure 256-bit encrypted checkout
                        </div>
                    </CardContent>
                    <CardFooter className="p-6 bg-white">
                        <Button 
                            className="w-full h-14 text-xl bg-slate-900 shadow-lg shadow-slate-200" 
                            onClick={handlePayment} 
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                            ) : (
                                <><CreditCard className="mr-2 h-5 w-5" /> Pay ₹{service.price.toLocaleString('en-IN')}</>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {step === 3 && (
                <Card className="text-center py-10 border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-green-500" />
                    <CardContent className="flex flex-col items-center space-y-6 pt-6">
                        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Payment Successful!</h2>
                            <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
                                Your compliance record for <span className="font-bold text-slate-900">{service.title}</span> has been created. Our expert will contact you shortly to collect the required documents.
                            </p>
                        </div>
                        
                        <div className="w-full max-w-xs space-y-3 pt-4">
                            <Button onClick={() => router.push("/")} className="w-full h-12 bg-slate-900">
                                Go to Dashboard
                            </Button>
                            <Button variant="outline" onClick={() => router.push("/compliances")} className="w-full h-12">
                                View Compliance Tracker
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
