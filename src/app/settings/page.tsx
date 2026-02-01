"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Construction } from "lucide-react"

export default function SettingsPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center">
                <Construction className="h-12 w-12 text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Settings Coming Soon</h1>
            <p className="text-muted-foreground text-center max-w-sm">
                We are working hard to build the settings module. Check back later.
            </p>
            <Button
                onClick={() => toast.info("Settings module is under active development.")}
            >
                Notify Me
            </Button>
        </div>
    )
}
