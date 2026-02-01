import { ComplianceTable } from "@/components/dashboard/compliance-table";
import { fetchCompliances } from "@/lib/api";

// We can Server Component fetch here for demo or Client Component
// Keeping it simple since I used Client Query in Dashboard
// I'll just show 'Coming Soon' or the Table for now.
// Actually, I'll reuse the Table in a client component wrapper.

import { CompliancesPageClient } from "./client";

export default function CompliancesPage() {
    return <CompliancesPageClient />;
}
