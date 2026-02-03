"use client"

import React, { createContext, useContext, useState } from "react"

// Types
export interface Admin {
    id: string
    name: string
    email: string
    status: "ACTIVE" | "INACTIVE"
    clientsAssigned: number
    maxClients: number
}

export interface Client {
    id: string
    name: string
    companyName: string
    status: "ACTIVE" | "INACTIVE"
    assignedAdminId: string | null
    pendingWork: number
    completedWork: number
    email?: string // Added email for list view
    phone?: string // Added phone for list view
    joinedDate?: string
}

interface SuperAdminContextType {
    admins: Admin[]
    clients: Client[]
    updateAdminStatus: (adminId: string) => void
    assignClient: (clientId: string, adminId: string | null) => void
    addAdmin: (admin: Admin) => void
    addClient: (client: Omit<Client, "id" | "status" | "pendingWork" | "completedWork">) => void
    updateClient: (clientId: string, updates: Partial<Client>) => void
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined)

// Initial Mock Data
const initialAdmins: Admin[] = [
    { id: "admin-1", name: "Alice Johnson", email: "alice@unitedfillings.com", status: "ACTIVE", clientsAssigned: 5, maxClients: 10 },
    { id: "admin-2", name: "Bob Smith", email: "bob@unitedfillings.com", status: "ACTIVE", clientsAssigned: 8, maxClients: 10 },
    { id: "admin-3", name: "Charlie Davis", email: "charlie@unitedfillings.com", status: "INACTIVE", clientsAssigned: 0, maxClients: 10 },
]

const initialClients: Client[] = [
    { id: "client-1", name: "Vikram Singh", companyName: "TechStart Solutions", status: "ACTIVE", assignedAdminId: "admin-1", pendingWork: 2, completedWork: 10, email: "vikram@techstart.com", phone: "+91 98765 43210", joinedDate: "12 Jan 2024" },
    { id: "client-2", name: "Sarah Connor", companyName: "SkyNet Systems", status: "ACTIVE", assignedAdminId: "admin-2", pendingWork: 5, completedWork: 15, email: "sarah@skynet.com", phone: "+91 98765 43211", joinedDate: "15 Feb 2024" },
    { id: "client-3", name: "Bruce Wayne", companyName: "Wayne Enterprises", status: "ACTIVE", assignedAdminId: null, pendingWork: 0, completedWork: 0, email: "bruce@wayne.com", phone: "+91 98765 43212", joinedDate: "20 Feb 2024" }, // Unassigned
    { id: "client-4", name: "Tony Stark", companyName: "Stark Industries", status: "ACTIVE", assignedAdminId: "admin-1", pendingWork: 1, completedWork: 20, email: "tony@stark.com", phone: "+91 98765 43213", joinedDate: "01 Mar 2024" },
]

export function SuperAdminProvider({ children }: { children: React.ReactNode }) {
    const [admins, setAdmins] = useState<Admin[]>(initialAdmins)
    const [clients, setClients] = useState<Client[]>(initialClients)

    const updateAdminStatus = (adminId: string) => {
        setAdmins(prev => prev.map(admin =>
            admin.id === adminId
                ? { ...admin, status: admin.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }
                : admin
        ))
    }

    const assignClient = (clientId: string, newAdminId: string | null) => {
        const client = clients.find(c => c.id === clientId)
        if (!client) return

        const oldAdminId = client.assignedAdminId

        // Return if no change
        if (oldAdminId === newAdminId) return

        // Update Client
        setClients(prev => prev.map(c =>
            c.id === clientId ? { ...c, assignedAdminId: newAdminId } : c
        ))

        // Update Admin Counts
        setAdmins(prev => prev.map(a => {
            let countChange = 0
            if (a.id === newAdminId) countChange += 1
            if (a.id === oldAdminId) countChange -= 1

            if (countChange !== 0) {
                return { ...a, clientsAssigned: Math.max(0, a.clientsAssigned + countChange) }
            }
            return a
        }))
    }

    const addAdmin = (admin: Admin) => {
        setAdmins(prev => [...prev, admin])
    }

    const addClient = (Client: Omit<Client, "id" | "status" | "pendingWork" | "completedWork">) => {
        const newClient: Client = {
            id: `client-${Date.now()}`,
            status: "ACTIVE",
            pendingWork: 0,
            completedWork: 0,
            ...Client
        }
        setClients(prev => [...prev, newClient])
    }

    const updateClient = (clientId: string, updates: Partial<Client>) => {
        setClients(prev => prev.map(client =>
            client.id === clientId ? { ...client, ...updates } : client
        ))
    }

    return (
        <SuperAdminContext.Provider value={{ admins, clients, updateAdminStatus, assignClient, addAdmin, addClient, updateClient }}>
            {children}
        </SuperAdminContext.Provider>
    )
}

export function useSuperAdmin() {
    const context = useContext(SuperAdminContext)
    if (context === undefined) {
        throw new Error("useSuperAdmin must be used within a SuperAdminProvider")
    }
    return context
}
