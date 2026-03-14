"use client"

import { useCompany } from "@/context/company-context"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus } from "lucide-react"
import { useState } from "react"
import { ManageMembersDialog } from "@/components/company/ManageMembersDialog"
import { Company } from "@/types"

export default function UsersPage() {
    const { user } = useAuth()
    const { companies, refreshAll: fetchCompanies } = useCompany()
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
    const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false)

    // Role-based access logic
    const canManageAny = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
    
    // For USER: only companies where they are members
    // For ADMIN/SUPER_ADMIN: all companies (filtered by context)
    const displayCompanies = canManageAny ? companies : companies.filter((c) => {
        const member = c.members?.find((m) => (typeof m.user === "string" ? m.user === user?._id : m.user?._id === user?._id))
        return !!member;
    })

    const handleManageMembers = (company: Company) => {
        setSelectedCompany(company)
        setIsMembersDialogOpen(true)
    }

    const handleMemberUpdate = () => {
        fetchCompanies(true)
        if (selectedCompany) {
            const updated = companies.find((c) => c._id === selectedCompany._id)
            if (updated) setSelectedCompany(updated)
        }
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Users & Roles</h1>
                <p className="text-slate-500 mt-1">
                    {canManageAny ? "Manage company members and their access levels" : "View company members and their roles"}
                </p>
            </div>

            {displayCompanies.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600 font-medium">No companies found</p>
                        <p className="text-sm text-slate-500 mt-1">
                            {canManageAny ? "Create a company to manage its members." : "You are not a member of any company yet."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {displayCompanies.map((company) => (
                        <Card key={company._id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center justify-between">
                                    <span className="truncate">{company.name}</span>
                                    <Badge variant="outline" className="text-xs shrink-0">
                                        {company.memberCount ?? company.members?.length ?? 0} members
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => handleManageMembers(company)}
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    {canManageAny ? "Manage Members" : "View Members"}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {selectedCompany && (
                <ManageMembersDialog
                    isOpen={isMembersDialogOpen}
                    onClose={() => {
                        setIsMembersDialogOpen(false)
                        setSelectedCompany(null)
                    }}
                    company={selectedCompany}
                    onUpdate={handleMemberUpdate}
                />
            )}
        </div>
    )
}
