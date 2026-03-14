"use client"

import { useCompany } from "@/context/company-context"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Bell, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { useCompliance } from "@/context/compliance-context"
import { useAuth } from "@/context/auth-context"
import { isSuperAdmin } from "@/lib/roles"

export function Header() {
    const { selectedCompany, setSelectedCompany, companies } = useCompany()
    const { globalSearch, setGlobalSearch } = useCompliance()
    const { user } = useAuth()

    return (
        <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b bg-white px-4 md:px-6 shadow-sm">
            <div className="flex items-center gap-4 ml-10 lg:ml-0">
                <div className="w-[180px] md:w-[240px]">
                    <Select
                        value={selectedCompany?._id || 'all'}
                        onValueChange={(value) => {
                            if (value === 'all') {
                                setSelectedCompany(null as any) // handled in context
                            } else {
                                const company = companies.find((c) => c._id === value)
                                if (company) setSelectedCompany(company)
                            }
                        }}
                    >
                        <SelectTrigger className="w-full bg-slate-50 border-slate-200">
                            <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                <span className="font-medium text-slate-900">
                                    {isSuperAdmin(user?.role) ? "All Companies" : "All My Companies"}
                                </span>
                            </SelectItem>
                            {companies.map((company) => {
                                return (
                                    <SelectItem key={company._id} value={company._id}>
                                        <span className="font-medium text-slate-900">{company.name}</span>
                                        <span className="ml-2 text-xs text-slate-500">({company.members?.length || 0} members)</span>
                                    </SelectItem>
                                )
                            })}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <div className="relative hidden md:block w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                        className="w-full bg-slate-50 pl-9 border-slate-200 focus-visible:ring-slate-400"
                    />
                </div>
                <Button variant="ghost" size="icon" className="md:hidden text-slate-500">
                    <Search className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-500">
                    <Bell className="h-5 w-5" />
                </Button>
            </div>
        </header>
    )
}
