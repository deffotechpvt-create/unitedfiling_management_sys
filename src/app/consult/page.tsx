"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
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

// --- TYPES ---
type ViewState = 'HOME' | 'STEP_1' | 'STEP_2' | 'LIST' | 'STATUS'
type ConsultType = 'CA' | 'LAWYER'

interface ExistingConsultation {
    id: string
    type: string
    expertName: string
    status: string
    date: string
}

export default function ConsultPage() {
    const [view, setView] = useState<ViewState>('HOME')
    const [selectedType, setSelectedType] = useState<ConsultType>('LAWYER')
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)
    const [showOtp, setShowOtp] = useState(false)
    const [otp, setOtp] = useState(["", "", "", "", "", ""])

    // Mock List Data
    const [consultations, setConsultations] = useState<ExistingConsultation[]>([
        // Initially empty or populate if needed. User image 4 shows one item.
        // We will add one after successful booking to simulate the flow.
    ])

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

    const handlePaymentClick = () => {
        setShowOtp(true)
    }

    const handleOtpVerify = () => {
        setShowOtp(false)
        // Add mock consultation
        const newConsult: ExistingConsultation = {
            id: `#${Math.floor(Math.random() * 10000000)}`,
            type: selectedType === 'CA' ? 'Talk to a CA' : 'Talk to a Lawyer',
            expertName: selectedType === 'CA' ? 'Akshay Bagri' : 'Aditya Verma',
            status: 'Check Status',
            date: date?.toLocaleDateString() || 'Recently'
        }
        setConsultations([...consultations, newConsult])
        setView('LIST')
    }

    const handleBack = () => {
        if (view === 'STEP_2') setView('STEP_1')
        if (view === 'STEP_1') setView('HOME')
        if (view === 'STATUS') setView('LIST')
    }

    const handleCheckStatus = () => {
        setView('STATUS')
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
                    <h1 className="text-2xl font-bold text-slate-900">Consultations</h1>
                    {view === 'LIST' || view === 'HOME' ? (
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
                                                {consult.expertName.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-slate-900">{consult.id} - {consult.type}</p>
                                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                                                <span>{consult.expertName}</span>
                                                <span>•</span>
                                                <span>{consult.type.includes('CA') ? 'CA' : 'Lawyer'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button onClick={handleCheckStatus} variant="outline" className="border-slate-300 text-slate-700 bg-white">
                                        {consult.status}
                                    </Button>
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
                                    <h3 className="font-semibold text-slate-900 border-b pb-2">Booking Information</h3>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-slate-500 text-xs uppercase tracking-wide">Mobile Number</Label>
                                            <Input defaultValue="+91- 8852463178" className="bg-white" readOnly />
                                        </div>
                                        <div className="space-y-2 bg-slate-100 p-3 rounded-md border border-slate-200">
                                            <Label className="text-slate-500 text-xs uppercase tracking-wide">Date & Time</Label>
                                            <p className="font-medium text-slate-900 text-sm">
                                                {date?.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' })} {selectedTimeSlot}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                                        <Label className="text-slate-600">Would you like to hire a lawyer to handle your case?</Label>
                                        <RadioGroup defaultValue="no" className="flex gap-6">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="yes" id="r1" />
                                                <Label htmlFor="r1">Yes</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="no" id="r2" />
                                                <Label htmlFor="r2">No</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-8 border-t border-slate-200">
                                    <Button variant="ghost" onClick={handleBack} className="text-slate-500 hover:text-slate-900">
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                    </Button>
                                    <Button onClick={handlePaymentClick} className="bg-[#002A52] hover:bg-[#001f3f] min-w-[200px] h-11 text-base">
                                        Proceed to Payment
                                    </Button>
                                </div>
                            </div>
                        )}
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

                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        {/* Status Header */}
                        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                            <div className="flex gap-4">
                                <Avatar className="h-12 w-12 border border-slate-100 bg-slate-50">
                                    <AvatarFallback><User className="h-6 w-6 text-slate-400" /></AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Talk to a {selectedType === 'CA' ? 'CA' : 'Lawyer'}</h2>
                                    <p className="text-sm text-slate-500">Ticket no <span className="text-slate-900 font-medium">#{Math.floor(Math.random() * 100000) + 550000}</span></p>
                                </div>
                            </div>
                            <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs h-auto py-1">
                                <span className="mr-2">⚠</span> Report an issue
                            </Button>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Messages Banner */}
                            <div className="bg-[#fcf6ee] border border-[#f5e6d3] rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-[#faefe0] transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#e8dccb] p-2 rounded-full">
                                        <div className="w-4 h-4 flex items-center justify-center">💬</div>
                                    </div>
                                    <span className="font-semibold text-[#5a4631]">Messages</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-[#5a4631]" />
                            </div>

                            {/* Track Process */}
                            <div className="space-y-6">
                                <h3 className="font-bold text-slate-900 text-lg">Track process</h3>

                                <div className="space-y-0 relative pl-2">
                                    {/* Vertical Line */}
                                    <div className="absolute left-[7px] top-2 bottom-6 w-[2px] bg-slate-200"></div>

                                    {/* Step 1: Payment (Pending) */}
                                    <div className="relative pl-8 pb-8">
                                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full border-4 border-slate-400 bg-white z-10 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                                        </div>
                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-semibold text-slate-700">Payment</h4>
                                                <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">Pending</span>
                                            </div>
                                            <p className="text-sm text-slate-500">Your payment is pending for this Talk to a CA. Click 'Pay now' to proceed further.</p>
                                            <Button className="w-full bg-[#001f3f] hover:bg-[#001f3f]/90 text-white">
                                                Pay now <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Step 2: Consultation Scheduled */}
                                    <div className="relative pl-8 pb-8">
                                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-slate-300 bg-white z-10"></div>
                                        <h4 className="text-slate-400 font-medium pt-0.5">Consultation Scheduled</h4>
                                    </div>

                                    {/* Step 3: Consultation Completed */}
                                    <div className="relative pl-8">
                                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-slate-300 bg-white z-10"></div>
                                        <h4 className="text-slate-400 font-medium pt-0.5">Consultation Completed</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* OTP Dialog */}
            <Dialog open={showOtp} onOpenChange={setShowOtp}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center">Confirmation code required</DialogTitle>
                        <DialogDescription className="text-center text-xs">
                            Enter the confirmation code sent to your mobile number
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center gap-2 py-4">
                        {otp.map((d, i) => (
                            <Input
                                key={i}
                                className="w-10 h-10 text-center p-0 text-lg"
                                maxLength={1}
                                value={d}
                                onChange={(e) => {
                                    const newOtp = [...otp]
                                    newOtp[i] = e.target.value
                                    setOtp(newOtp)
                                    // Auto-focus next logic could go here
                                }}
                            />
                        ))}
                    </div>
                    <div className="text-center text-xs text-blue-600 cursor-pointer hover:underline mb-2">
                        Send again in (28s)
                    </div>
                    <Button onClick={handleOtpVerify} className="w-full bg-[#002A52] hover:bg-[#001f3f]">
                        Verify & Proceed
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    )
}
