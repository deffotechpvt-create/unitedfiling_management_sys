"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, QrCode, Loader2 } from "lucide-react"
import confetti from "canvas-confetti"

interface ESignModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onComplete: () => void
}

export function ESignModal({ open, onOpenChange, onComplete }: ESignModalProps) {
    const [step, setStep] = useState<"qr" | "processing" | "success">("qr")

    useEffect(() => {
        if (open && step === "qr") {
            // Simulate user scanning QR after 3 seconds
            const timer = setTimeout(() => {
                setStep("processing")
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [open, step])

    useEffect(() => {
        if (step === "processing") {
            // Simulate backend validation after 2 seconds
            const timer = setTimeout(() => {
                setStep("success")
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                })
                onComplete()
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [step, onComplete])

    const handleClose = () => {
        if (step === "success") {
            onOpenChange(false)
            setStep("qr") // Reset for next time
        } else {
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Director Signature Required</DialogTitle>
                    <DialogDescription>
                        Scan the QR code with your mobile device to securely sign the document.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center p-6 space-y-6">
                    {step === "qr" && (
                        <div className="relative flex flex-col items-center animate-in fade-in zoom-in duration-300">
                            <div className="h-48 w-48 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-slate-900">
                                <QrCode className="h-24 w-24 text-slate-900" />
                            </div>
                            <p className="mt-4 text-sm text-muted-foreground">Waiting for scan...</p>
                        </div>
                    )}

                    {step === "processing" && (
                        <div className="flex flex-col items-center animate-in fade-in duration-300">
                            <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
                            <p className="mt-4 font-medium text-slate-900">Verifying Signature...</p>
                        </div>
                    )}

                    {step === "success" && (
                        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Signed Successfully</h3>
                            <p className="text-center text-sm text-slate-500 mt-2">
                                The document has been digitally signed and filed.
                            </p>
                            <Button className="mt-6 w-full" onClick={handleClose}>Done</Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
