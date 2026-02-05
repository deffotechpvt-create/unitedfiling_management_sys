"use client"

import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Users, Search, Filter, Download, Plus, Pencil } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useSuperAdmin, Client } from "@/context/super-admin-context"
import { useState } from "react"

export default function ClientListPage() {
    const { admins, clients, assignClient, addClient, updateClient } = useSuperAdmin()
    const [searchQuery, setSearchQuery] = useState("")

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingClient, setEditingClient] = useState<Client | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        companyName: "",
        email: "",
        phone: "",
        joinedDate: new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })
    })

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.companyName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleAssignChange = (clientId: string, val: string) => {
        const adminId = val === "unassigned" ? null : val
        assignClient(clientId, adminId)
    }

    const handleOpenAdd = () => {
        setEditingClient(null)
        setFormData({
            name: "",
            companyName: "",
            email: "",
            phone: "",
            joinedDate: new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })
        })
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (client: Client) => {
        setEditingClient(client)
        setFormData({
            name: client.name,
            companyName: client.companyName,
            email: client.email || "",
            phone: client.phone || "",
            joinedDate: client.joinedDate || ""
        })
        setIsDialogOpen(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (editingClient) {
            updateClient(editingClient.id, formData)
        } else {
            addClient({ ...formData, assignedAdminId: null })
        }
        setIsDialogOpen(false)
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Client List</h1>
                    <p className="text-slate-500">View and manage all registered clients and their assignments.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={handleOpenAdd}>
                                <Plus className="mr-2 h-4 w-4" /> Add Client
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
                                <DialogDescription>
                                    {editingClient ? "Update client details here." : "Enter details for the new client."}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Client Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="company">Company Name</Label>
                                        <Input
                                            id="company"
                                            value={formData.companyName}
                                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit">{editingClient ? "Save Changes" : "Add Client"}</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            All Clients
                        </CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search clients..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Client Name</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Joined Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Assigned Admin</TableHead>
                                <TableHead className="text-right">Assign</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClients.map((client) => {
                                const assignedAdmin = admins.find(a => a.id === client.assignedAdminId)
                                return (
                                    <TableRow key={client.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-blue-100 text-blue-700">{client.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                {client.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{client.companyName}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs text-slate-500">
                                                <span>{client.email}</span>
                                                <span>{client.phone}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{client.joinedDate}</TableCell>
                                        <TableCell>
                                            <Badge variant={client.status === "ACTIVE" ? "default" : "secondary"}>
                                                {client.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {assignedAdmin ? (
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="font-normal bg-slate-50">
                                                        {assignedAdmin.name}
                                                    </Badge>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic text-sm">Unassigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Select
                                                value={client.assignedAdminId || "unassigned"}
                                                onValueChange={(val) => handleAssignChange(client.id, val)}
                                            >
                                                <SelectTrigger className="w-[140px] ml-auto h-8 text-xs">
                                                    <SelectValue placeholder="Assign" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unassigned" className="text-red-500">Unassign</SelectItem>
                                                    {admins
                                                        .filter(a => a.status === "ACTIVE")
                                                        .map(admin => (
                                                            <SelectItem
                                                                key={admin.id}
                                                                value={admin.id}
                                                                disabled={admin.clientsAssigned >= admin.maxClients}
                                                            >
                                                                {admin.name} ({admin.clientsAssigned}/10)
                                                            </SelectItem>
                                                        ))
                                                    }
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => handleOpenEdit(client)}
                                            >
                                                <span className="sr-only">Edit</span>
                                                <Pencil className="h-4 w-4 text-slate-500 hover:text-blue-600" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
