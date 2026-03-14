
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, ChevronLeft, ChevronRight, Video, Phone, CheckCircle2, User, Clock, Calendar as CalendarIcon, ArrowLeft } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useConsultation } from "@/context/consultation-context"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { canManageConsultations, isSuperAdmin } from "@/lib/roles"

// --- TYPES ---
type ViewState = 'HOME' | 'STEP_1' | 'STEP_2' | 'SUCCESS' | 'LIST' | 'STATUS'
type ConsultType = 'CA' | 'LAWYER'

export default function ConsultPage() {
    const {
        consultations,
        currentConsultation,
        admins,
        loading,
        fetchConsultationById,
        createPaymentOrder,
        verifyPaymentAndBook,
        refundConsultation,
        sendConsultationMessage,
        assignExpert,
        updateConsultationStatus,
        setCurrentConsultation
    } = useConsultation();
    const { user, updateOnboardingTask } = useAuth();
    
    useEffect(() => {
        if (user?.onboardingTasks && !user.onboardingTasks.consultExpert) {
            updateOnboardingTask('consultExpert');
        }
    }, [updateOnboardingTask, user?.onboardingTasks]);
    const isAdmin = canManageConsultations(user?.role);
    const superAdmin = isSuperAdmin(user?.role);

    const [view, setView] = useState<ViewState>('HOME')
    const [selectedType, setSelectedType] = useState<ConsultType>('LAWYER')
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
    const [successData, setSuccessData] = useState<any>(null)
    const [showMessages, setShowMessages] = useState(false)
    const [newMessage, setNewMessage] = useState("")
    const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false)
    const [consultationToRefund, setConsultationToRefund] = useState<any>(null)

    // Mock Time Slots
    const timeSlots = {
        afternoon: ["2:30 PM", "3:00 PM", "3:30 PM"],
        evening: ["4:00 PM", "4:30 PM"]
    }

    // --- HANDLERS ---
    const startBooking = (type: ConsultType) => {
        setSelectedType(type)
        setView('STEP_1')
    }

    const handleStep1Next = () => {
        if (date && selectedTimeSlot) {
            setView('STEP_2')
        }
    }

    const handlePaymentClick = async () => {
        const orderData = await createPaymentOrder(1000);
        
        if (!orderData) return;

        const formData = {
            type: selectedType,
            date: date?.toISOString(),
            time: selectedTimeSlot || undefined,
            notes: `Consultation with ${selectedType}`
        };

        const options = {
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'United Fillings',
            description: 'Expert Consultation - ₹1,000',
            order_id: orderData.orderId,
            handler: async (response: any) => {
                const success = await verifyPaymentAndBook({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                }, formData);

                if (success) {
                    setSuccessData({
                        amount: 1000,
                        paymentId: response.razorpay_payment_id
                    });
                    setView('SUCCESS');
                }
            },
            prefill: {
                name: user?.name,
                email: user?.email,
                contact: user?.phone || ''
            },
            theme: { color: '#002A52' },
            modal: {
                ondismiss: () => toast.error('Payment cancelled')
            }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
    }



    const handleBack = () => {
        if (view === 'STEP_2') setView('STEP_1')
        else if (view === 'STEP_1') setView('HOME')
        else if (view === 'STATUS') setView('LIST')
        else if (view === 'LIST') setView('HOME')
    }

    const handleCheckStatus = (id: string) => {
        const found = consultations.find(c => c._id === id);
        if (found) setCurrentConsultation(found);
        fetchConsultationById(id);
        setView('STATUS');
    }

    const isOwner = (consult: any) => {
        if (!consult || !user) return false;
        const consultUserId = typeof consult.user === 'object' ? consult.user._id : consult.user;
        return consultUserId === user._id;
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !currentConsultation) return;
        await sendConsultationMessage(currentConsultation._id, newMessage);
        setNewMessage("");
    }

    // --- COMPONENTS ---

    const LeftPanel = () => (
        <div className="hidden lg:flex flex-col justify-center bg-[#002A52] p-10 text-white rounded-l-xl relative overflow-hidden min-h-[600px]">
            {/* Background elements to look sophisticated */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-yellow-400 p-1.5 rounded-md">
                        <Video className="h-5 w-5 text-[#002A52]" />
                    </div>
                    <span className="font-bold text-xl">United Fillings</span>
                </div>

                <div className="space-y-4">
                    <h2 className="text-3xl font-bold leading-tight">
                        {view === 'STEP_1' ? "Choose How You'd Like to Start" : "You're Almost There!"}
                    </h2>
                    <p className="text-slate-300">
                        {view === 'STEP_1'
                            ? "Connect with a verified expert within 15 minutes. Select a time that works for you."
                            : "Please confirm your details to proceed with the secure payment gateway."}
                    </p>
                </div>

                {/* Summary Generator Feature Card matching Image 1 */}
                <div className="mt-8 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                    <div className="p-3 border-b border-white/10 flex items-center gap-2">
                        <Plus className="h-4 w-4 text-white" />
                        <span className="font-semibold text-sm">Summary Generator</span>
                    </div>
                    <div className="p-4 space-y-3">
                        <p className="text-xs font-semibold text-slate-300">Summary Highlights</p>
                        <ul className="space-y-2 text-[10px] text-slate-400 leading-relaxed">
                            <li className="flex gap-2">
                                <span className="block w-1 h-1 mt-1 rounded-full bg-slate-500 shrink-0" />
                                Upload any document or paste content to get a clear, AI-generated summary in seconds.
                            </li>
                            <li className="flex gap-2">
                                <span className="block w-1 h-1 mt-1 rounded-full bg-slate-500 shrink-0" />
                                Choose tone, length, and format that fits your need — from legal briefs to executive summaries.
                            </li>
                            <li className="flex gap-2">
                                <span className="block w-1 h-1 mt-1 rounded-full bg-slate-500 shrink-0" />
                                Share summaries with your expert or team for faster decisions.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )

    // --- RENDER ---
    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            {view !== 'STATUS' && (
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-slate-900">
                        {isAdmin ? "Consultation Management" : "Consultations"}
                    </h1>
                    {/* Only USER/CLIENT can book new consultations — ADMIN manages existing ones */}
                    {!isAdmin && (view === 'LIST' || view === 'HOME') ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="bg-[#002A52] hover:bg-[#001f3f] text-white gap-2">
                                    <Plus className="h-4 w-4" /> New Consultation
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => startBooking('LAWYER')}>
                                    Talk to Lawyer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => startBooking('CA')}>
                                    Talk to CA
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : null}
                </div>
            )}

            {/* List View (Shows if we have items OR if explicitly in LIST view) */}
            {(view === 'LIST' || (view === 'HOME' && consultations.length > 0)) && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="font-semibold text-slate-900">All Consultations</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {consultations.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">No active consultations. Start a new one!</div>
                        ) : (
                            consultations.map((consult, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarFallback className="bg-[#002A52] text-white">
                                                {consult.assignedExpert?.name.charAt(0) || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-slate-900">{consult.ticketNumber} - {consult.type === 'CA' ? 'Chartered Accountant' : 'Legal Consultant'}</p>
                                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                                                <span>{consult.assignedExpert?.name || "Expert Pending"}</span>
                                                <span>•</span>
                                                <span className={`${consult.payment?.status === 'PAID' ? 'text-green-600 font-medium' : ''}`}>
                                                    {consult.status}
                                                </span>
                                            </div>
                                            {(isAdmin || isOwner(consult)) && consult.payment && (
                                                <div className="mt-2 flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        {consult.payment.status === 'PAID' && (
                                                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200">
                                                                Paid ₹{consult.payment.amount}
                                                            </span>
                                                        )}
                                                        {consult.payment.status === 'REFUNDED' && (
                                                            <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200">
                                                                Refunded ₹{consult.payment.amount}
                                                            </span>
                                                        )}
                                                        {consult.payment.status === 'PENDING' && (
                                                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                                                                Payment Pending
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-slate-400">ID: {consult.payment.paymentId}</span>
                                                    </div>
                                                    
                                                    {user?.role === 'SUPER_ADMIN' && consult.payment.status === 'PAID' && (
                                                        <Button 
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                setConsultationToRefund(consult);
                                                                setIsRefundDialogOpen(true);
                                                            }}
                                                            size="sm" 
                                                            variant="destructive" 
                                                            className="h-7 text-xs w-fit"
                                                        >
                                                            Refund ₹1,000
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {consult.scheduledSlot?.date && (
                                            <div className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                                <Clock className="inline h-3 w-3 mr-1" />
                                                {new Date(consult.scheduledSlot.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} {consult.scheduledSlot.time}
                                            </div>
                                        )}
                                        <Button onClick={() => handleCheckStatus(consult._id)} variant="outline" className="border-slate-300 text-slate-700 bg-white">
                                            Check Status
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Empty Home View (Only if no consultations and in HOME view) */}
            {view === 'HOME' && consultations.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-8 md:p-12 shadow-sm min-h-[500px] flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1 space-y-6 text-center md:text-left">
                        <div className="mx-auto md:mx-0 relative w-16 h-16">
                            <CalendarIcon className="w-16 h-16 text-red-400 stroke-[1.5]" />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-2xl font-bold text-slate-900">Get Expert Advice. Instantly.</h2>
                            <p className="text-slate-500 leading-relaxed max-w-md mx-auto md:mx-0">
                                Get expert guidance on compliances, legal issues, or any service you need—from registrations to filings. our experts have you covered.
                            </p>
                        </div>
                    </div>
                    <div className="flex-1 w-full max-w-md">
                        <div className="bg-[#002A52] rounded-xl p-6 text-white space-y-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#002A52] to-black opacity-50 z-0"></div>
                            <div className="relative z-10 bg-slate-800 rounded-lg overflow-hidden border border-slate-700 shadow-lg aspect-video flex items-center justify-center">
                                {/* Mock Video Call UI */}
                                <div className="text-center">
                                    <Avatar className="h-16 w-16 mx-auto mb-2 border-2 border-white">
                                        <AvatarImage src="https://github.com/shadcn.png" />
                                        <AvatarFallback>EXP</AvatarFallback>
                                    </Avatar>
                                    <p className="text-sm font-medium">Connecting to Expert...</p>
                                </div>
                                <div className="absolute bottom-4 flex gap-2">
                                    <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md"><Video className="h-4 w-4" /></div>
                                    <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md"><Phone className="h-4 w-4" /></div>
                                    <div className="h-8 w-8 bg-red-500 rounded-full flex items-center justify-center"><Phone className="h-4 w-4 rotate-[135deg]" /></div>
                                </div>
                            </div>
                            <div className="space-y-4 text-center relative z-10">
                                <p className="text-sm text-slate-200">Select CA or Lawyer to consult a expert advice. Instantly</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button onClick={() => startBooking('CA')} className="bg-white text-[#002A52] hover:bg-slate-100 font-semibold">Talk to a CA</Button>
                                    <Button onClick={() => startBooking('LAWYER')} className="bg-white text-[#002A52] hover:bg-slate-100 font-semibold">Talk to a Lawyer</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Steps (Step 1 & 2) */}
            {(view === 'STEP_1' || view === 'STEP_2') && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex min-h-[600px]">
                    {/* Left Panel */}
                    <div className="w-1/3 min-w-[300px]">
                        <LeftPanel />
                    </div>

                    {/* Right Panel (Content) */}
                    <div className="flex-1 p-8 md:p-12 bg-slate-50">
                        {/* Progress Header */}
                        <div className="flex border-b border-slate-200 pb-4 mb-8">
                            <div className={`flex-1 text-sm font-medium pb-4 border-b-2 transition-colors ${view === 'STEP_1' ? 'border-[#002A52] text-[#002A52]' : 'border-transparent text-slate-400'}`}>
                                Step 1 of 2
                            </div>
                            <div className={`flex-1 text-sm font-medium pb-4 border-b-2 transition-colors ${view === 'STEP_2' ? 'border-[#002A52] text-[#002A52]' : 'border-transparent text-slate-400'}`}>
                                Step 2 of 2
                            </div>
                        </div>

                        {/* STEP 1 CONTENT */}
                        {view === 'STEP_1' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Banner */}
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white p-2 rounded-full shadow-sm">
                                            <Phone className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-blue-900">Instant {selectedType === 'CA' ? 'CA' : 'Lawyer'} Call</h4>
                                            <p className="text-xs text-blue-700">Connect within 15 minutes after payment</p>
                                        </div>
                                    </div>
                                    <Button size="sm" className="bg-[#002A52] hover:bg-[#001f3f]">Consult Now</Button>
                                </div>

                                <div className="grid lg:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <Label>Select Date</Label>
                                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={setDate}
                                                className="rounded-md"
                                                classNames={{
                                                    day_selected: "bg-[#002A52] text-white hover:bg-[#002A52] focus:bg-[#002A52]"
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <Label>Select Time</Label>

                                        <div className="space-y-2">
                                            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider flex items-center gap-2">
                                                <div className="w-1 h-1 bg-yellow-400 rounded-full" /> Afternoon
                                            </span>
                                            <div className="grid grid-cols-2 gap-2">
                                                {timeSlots.afternoon.map(time => (
                                                    <Button
                                                        key={time}
                                                        variant="outline"
                                                        onClick={() => setSelectedTimeSlot(time)}
                                                        className={`justify-center ${selectedTimeSlot === time ? 'bg-[#002A52] text-white hover:bg-[#001f3f]' : 'bg-white hover:bg-slate-50'}`}
                                                    >
                                                        {time}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider flex items-center gap-2">
                                                <div className="w-1 h-1 bg-indigo-400 rounded-full" /> Evening
                                            </span>
                                            <div className="grid grid-cols-2 gap-2">
                                                {timeSlots.evening.map(time => (
                                                    <Button
                                                        key={time}
                                                        variant="outline"
                                                        onClick={() => setSelectedTimeSlot(time)}
                                                        className={`justify-center ${selectedTimeSlot === time ? 'bg-[#002A52] text-white hover:bg-[#001f3f]' : 'bg-white hover:bg-slate-50'}`}
                                                    >
                                                        {time}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button
                                        onClick={handleStep1Next}
                                        disabled={!date || !selectedTimeSlot}
                                        className="bg-slate-200 text-slate-500 hover:bg-[#002A52] hover:text-white min-w-[120px] transition-all"
                                    >
                                        Next <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2 CONTENT */}
                        {view === 'STEP_2' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Match Found Banner */}
                                <div className="bg-slate-100 p-4 rounded-lg flex items-center gap-4">
                                    <div className="flex -space-x-2">
                                        <Avatar className="h-8 w-8 border-2 border-white"><AvatarImage src="https://i.pravatar.cc/150?u=1" /><AvatarFallback>A</AvatarFallback></Avatar>
                                        <Avatar className="h-8 w-8 border-2 border-white"><AvatarImage src="https://i.pravatar.cc/150?u=2" /><AvatarFallback>B</AvatarFallback></Avatar>
                                        <Avatar className="h-8 w-8 border-2 border-white"><AvatarImage src="https://i.pravatar.cc/150?u=3" /><AvatarFallback>C</AvatarFallback></Avatar>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                            <span className="bg-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded text-[#002A52]">MATCH FOUND</span>
                                            3 {selectedType === 'CA' ? 'CAs' : 'Lawyers'} found
                                        </p>
                                        <p className="text-xs text-slate-500">Specialized in property and financial matters. Assigned upon payment.</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="border rounded-lg overflow-hidden bg-white">
                                        <div className="bg-slate-50 p-4 border-b">
                                            <h3 className="font-semibold text-slate-900">Consultation Booking Summary</h3>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500">Title:</span>
                                                <span className="font-medium text-slate-900">Talk to a {selectedType === 'CA' ? 'Chartered Accountant' : 'Lawyer'}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500">Date:</span>
                                                <span className="font-medium text-slate-900">
                                                    {date?.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' })} {selectedTimeSlot}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500">Expert:</span>
                                                <span className="font-medium text-slate-900">To be assigned</span>
                                            </div>
                                            <div className="border-t pt-4 mt-4 space-y-2">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500">Consultation Fee:</span>
                                                    <span className="text-slate-900 font-medium">₹1,000</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500">Tax:</span>
                                                    <span className="text-slate-900 font-medium">Included</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg mt-2">
                                                    <span className="font-semibold text-[#002A52]">Total:</span>
                                                    <span className="font-bold text-lg text-[#002A52]">₹1,000</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-8 border-t border-slate-200">
                                    <Button variant="ghost" onClick={handleBack} className="text-slate-500 hover:text-slate-900">
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>
                                    <Button onClick={handlePaymentClick} className="bg-[#002A52] hover:bg-[#001f3f] min-w-[200px] h-11 text-base">
                                        Pay ₹1,000 <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* SUCCESS View */}
            {view === 'SUCCESS' && (
                <div className="max-w-2xl mx-auto mt-10">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm text-center overflow-hidden">
                        <div className="bg-green-500 py-6">
                            <CheckCircle2 className="h-16 w-16 text-white mx-auto" />
                            <h2 className="text-2xl font-bold text-white mt-4">Consultation Booked!</h2>
                        </div>
                        <div className="p-8 space-y-6">
                            <p className="text-slate-500">Your payment of ₹{successData?.amount.toLocaleString()} was successful and your consultation has been confirmed.</p>
                            
                            <div className="bg-slate-50 rounded-lg p-6 max-w-sm mx-auto space-y-3 text-left border">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Payment ID:</span>
                                    <span className="font-mono font-medium">{successData?.paymentId}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Amount Paid:</span>
                                    <span className="font-medium">₹1,000</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Status:</span>
                                    <span className="text-green-600 font-medium">Confirmed</span>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 font-medium">Our expert will contact you soon.</p>
                            
                            <Button 
                                onClick={() => {
                                    setView('LIST');
                                    setSuccessData(null);
                                }} 
                                className="bg-[#002A52] hover:bg-[#001f3f] w-full max-w-xs"
                            >
                                View My Consultations
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* STATUS View */}
            {view === 'STATUS' && (
                <div className="space-y-6">
                    {/* Back Button */}
                    <button onClick={handleBack} className="flex items-center text-slate-500 hover:text-slate-900 text-sm font-medium">
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </button>

                    {loading && !currentConsultation ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center space-y-4 shadow-sm">
                            <div className="w-12 h-12 border-4 border-[#002A52] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-500 animate-pulse">Fetching consultation details...</p>
                        </div>
                    ) : !currentConsultation ? (
                        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
                            <p className="text-slate-500 text-lg">Consultation not found.</p>
                            <Button onClick={handleBack} className="mt-4 bg-[#002A52]">Return to List</Button>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        {/* Status Header */}
                        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                            <div className="flex gap-4">
                                <Avatar className="h-12 w-12 border border-slate-100 bg-slate-50">
                                    <AvatarFallback>
                                        {currentConsultation?.assignedExpert?.name?.charAt(0) || <User className="h-6 w-6 text-slate-400" />}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">{currentConsultation?.type === 'CA' ? 'Chartered Accountant Consultation' : 'Legal Consultant Consultation'}</h2>
                                    <p className="text-sm text-slate-500">
                                        {currentConsultation?.ticketNumber ? (
                                            <>Ticket no <span className="text-slate-900 font-medium">#{currentConsultation?.ticketNumber}</span></>
                                        ) : (
                                            <span className="animate-pulse italic">Loading ticket details...</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {superAdmin && currentConsultation && (
                                    <Select
                                        value={(typeof currentConsultation.assignedExpert === "object" ? currentConsultation.assignedExpert?._id : currentConsultation.assignedExpert) || "unassigned"}
                                        onValueChange={(val) => val && val !== "unassigned" && assignExpert(currentConsultation._id, val)}
                                    >
                                        <SelectTrigger className="h-8 w-[140px] text-xs">
                                            <SelectValue placeholder="Assign expert" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            {admins.map((a) => (
                                                <SelectItem key={a._id} value={a._id}>{a.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                {isAdmin && currentConsultation && (
                                    <Select
                                        value={currentConsultation.status}
                                        onValueChange={(val) => updateConsultationStatus(currentConsultation._id, val)}
                                    >
                                        <SelectTrigger className="h-8 w-[130px] text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PENDING">Pending</SelectItem>
                                            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                            <SelectItem value="COMPLETED">Completed</SelectItem>
                                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                                {!isAdmin && (
                                    <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs h-auto py-1">
                                        <span className="mr-2">⚠</span> Report an issue
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Messages Banner */}
                            <div
                                onClick={() => setShowMessages(true)}
                                className="bg-[#fcf6ee] border border-[#f5e6d3] rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-[#faefe0] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#e8dccb] p-2 rounded-full">
                                        <div className="w-4 h-4 flex items-center justify-center">💬</div>
                                    </div>
                                    <span className="font-semibold text-[#5a4631]">Messages ({currentConsultation?.messages.length || 0})</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-[#5a4631]" />
                            </div>

                            {/* Track Process */}
                            <div className="space-y-6">
                                <h3 className="font-bold text-slate-900 text-lg">Track process</h3>

                                <div className="space-y-0 relative pl-2">
                                    {/* Vertical Line */}
                                    <div className="absolute left-[7px] top-2 bottom-6 w-[2px] bg-slate-200"></div>

                                    {/* Step 1: Payment */}
                                    <div className="relative pl-8 pb-8">
                                        <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-4 ${currentConsultation?.payment?.status !== 'PAID' ? 'border-orange-500' : 'border-green-500'} bg-white z-10 flex items-center justify-center`}>
                                            <div className={`w-1.5 h-1.5 ${currentConsultation?.payment?.status !== 'PAID' ? 'bg-orange-500' : 'bg-green-500'} rounded-full`} />
                                        </div>
                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-semibold text-slate-700">Payment</h4>
                                                <span className={`${currentConsultation?.payment?.status !== 'PAID' ? 'bg-orange-500' : 'bg-green-500'} text-white text-[10px] font-bold px-2 py-0.5 rounded`}>
                                                    {currentConsultation?.payment?.status !== 'PAID' ? 'Pending' : 'Completed'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500">
                                                {currentConsultation?.payment?.status !== 'PAID'
                                                    ? "Your payment is pending for this consultation. Click 'Pay now' to proceed further."
                                                    : "Payment received. Your consultation is confirmed."}
                                            </p>
                                            {currentConsultation?.payment?.status !== 'PAID' && (
                                                <Button className="w-full bg-[#001f3f] hover:bg-[#001f3f]/90 text-white">
                                                    Pay now <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Step 2: Consultation Scheduled */}
                                    <div className="relative pl-8 pb-8">
                                        <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 ${['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(currentConsultation?.status || '') ? 'border-green-500 bg-green-500' : 'border-slate-300 bg-white'} z-10 flex items-center justify-center`}>
                                            {['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(currentConsultation?.status || '') && <CheckCircle2 className="h-3 w-3 text-white" />}
                                        </div>
                                        <h4 className={`${['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(currentConsultation?.status || '') ? 'text-slate-900' : 'text-slate-400'} font-medium pt-0.5`}>
                                            Consultation Scheduled
                                        </h4>
                                        {(currentConsultation?.status === 'CONFIRMED' || currentConsultation?.status === 'IN_PROGRESS') && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                Scheduled for {new Date(currentConsultation.scheduledSlot?.date || '').toLocaleDateString()} at {currentConsultation.scheduledSlot?.time}
                                            </p>
                                        )}
                                    </div>

                                    {/* Step 3: Consultation Completed */}
                                    <div className="relative pl-8">
                                        <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 ${currentConsultation?.status === 'COMPLETED' ? 'border-green-500 bg-green-500' : 'border-slate-300 bg-white'} z-10 flex items-center justify-center`}>
                                            {currentConsultation?.status === 'COMPLETED' && <CheckCircle2 className="h-3 w-3 text-white" />}
                                        </div>
                                        <h4 className={`${currentConsultation?.status === 'COMPLETED' ? 'text-slate-900' : 'text-slate-400'} font-medium pt-0.5`}>
                                            Consultation Completed
                                        </h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </div>
                    )}
                </div>
            )}

            {/* Messages Drawer/Dialog */}
            <Dialog open={showMessages} onOpenChange={setShowMessages}>
                <DialogContent className="sm:max-w-md h-[80vh] flex flex-col p-0">
                    <DialogHeader className="p-6 border-b">
                        <DialogTitle>Consultation Messages</DialogTitle>
                        <DialogDescription>
                            Ticket #{currentConsultation?.ticketNumber}
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-4">
                            {currentConsultation?.messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex flex-col ${msg.sender === 'User' ? 'items-end' : 'items-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${msg.sender === 'User'
                                                ? 'bg-[#002A52] text-white'
                                                : 'bg-slate-100 text-slate-900 border'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-1">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                            {currentConsultation?.messages.length === 0 && (
                                <div className="text-center py-10 text-slate-400 text-sm">
                                    No messages yet. Start the conversation!
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-4 border-t gap-2 sm:justify-start">
                        <Input
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="flex-1"
                        />
                        <Button
                            onClick={handleSendMessage}
                            className="bg-[#002A52] hover:bg-[#001f3f]"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Refund Confirmation Dialog */}
            <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Refund</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to refund ₹1,000 to {typeof consultationToRefund?.user === 'object' ? consultationToRefund.user.name : 'this user'}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)}>Cancel</Button>
                        <Button 
                            variant="destructive" 
                            onClick={async () => {
                                try {
                                    setIsRefundDialogOpen(false);
                                    await refundConsultation(consultationToRefund._id);
                                    toast.success("Refund of ₹1,000 processed successfully");
                                } catch (error) {
                                    toast.error("Refund failed. Please try again.");
                                }
                            }}
                        >
                            Yes, Refund
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
