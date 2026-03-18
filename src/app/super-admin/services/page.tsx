"use client";

import { ManageServicesTab } from "@/components/super-admin/ManageServicesTab";
import { ShoppingBag } from "lucide-react";

export default function SuperAdminServicesPage() {
    return (
        <div className="space-y-8 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Marketplace Management</h1>
                <p className="text-slate-500">Configure and manage services available to platform users.</p>
            </div>

            <ManageServicesTab />
        </div>
    );
}
