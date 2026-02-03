# Backend Handoff Documentation - United Fillings Compliance Platform

**Role:** Backend Engineer (Intern)
**Objective:** Build the REST API and Database schema to power the United Fillings frontend.
**Frontend Stack:** Next.js 14 (App Router), TypeScript, React Context, TanStack Query.

---

## 1. System Overview

The application is a Corporate Compliance & Legal Services dashboard with a Super Admin backend for management.

**Key Concepts:**
*   **Multi-Tenancy:** A User (e.g., Business Owner) can have access to multiple `Companies`.
*   **Global Context:** The user selects a `Company` from the top header. *All* dashboard data (compliances, files, risks) changes based on this selection.
*   **Role-Based Access Control (RBAC):**
    *   `SUPER_ADMIN`: 
        *   Can view "Global Dashboard" (Platform Aggregates).
        *   Can manage **Admins** (Create, Revoke Access, View Utilization).
        *   Can manage **Clients** (Create, Edit, Assign to Admins).
        *   Can view all files uploaded by Admins and Clients.
    *   `ADMIN`: 
        *   Can see their assigned Client List (Context: "My Clients").
        *   Can upload documents for clients.
        *   Can view Task/Compliance status for their clients.
    *   `USER`: 
        *   Can view their company dashboards.
        *   Can buy services and sign documents.
        *   **Cannot** upload documents (unless specifically requested in a flow).

---

## 2. Authentication & Users

Currently, the frontend uses a mock `AuthContext` (`src/context/auth-context.tsx`).

**Requirement:**
*   Implement JWT-based authentication.
*   **Endpoints:**
    *   `POST /api/auth/login`: Returns `{ token, user, role }`.
    *   `GET /api/auth/me`: Validates session.

**User Roles:**
*   `SUPER_ADMIN`: The top-level manager.
*   `ADMIN`: Staff members who manage clients.
*   `USER`: The end client (Business Owner).

---

## 3. Data Models & API Contract

The frontend strictly follows the interfaces defined in `src/types/index.ts` and `src/context/super-admin-context.tsx`. **Your API responses must match these structures.**

### A. Super Admin & Admin Management
The `SuperAdminContext` manages this state globally for the Super Admin view.

**Endpoints:**
*   `GET /api/admins`: List all admins with their statistics.
*   `POST /api/admins`: Create a new admin.
*   `PATCH /api/admins/:id/status`: Revoke/Grant access (Status: ACTIVE/INACTIVE).
*   `GET /api/clients`: List all clients (with Admin assignment info).
*   `POST /api/clients`: Create a new client (Name, Company, Email, Phone).
*   `PUT /api/clients/:id`: Update client details.
*   `POST /api/clients/:id/assign`: Assign a client to an admin. Payload: `{ adminId: string | null }`.

**Models:**

**Admin Model:**
```typescript
interface Admin {
    id: string
    name: string
    email: string
    status: "ACTIVE" | "INACTIVE"
    clientsAssigned: number
    maxClients: number // Default 10
}
```

**Client Model:**
```typescript
interface Client {
    id: string
    name: string
    companyName: string
    email?: string 
    phone?: string 
    status: "ACTIVE" | "INACTIVE"
    assignedAdminId: string | null
    pendingWork: number
    completedWork: number
    joinedDate?: string
}
```

### B. Companies (Global Switcher)
The frontend mock is in `src/context/company-context.tsx`.

**Endpoint:** `GET /api/users/me/companies`
**Response:** `Company[]`
```typescript
interface Company {
  id: string;
  name: string;
  role: string; // e.g., 'Owner', 'Admin', 'Viewer' - context of the user in this company
}
```

### C. Compliances (Dashboard Table)
Used in the main Dashboard and Compliance Page.

**Endpoint:** `GET /api/companies/:companyId/compliances`
**Query Params:** Support filtering by `status` (PENDING, DELAYED, etc.).
**Response:** `ComplianceRecord[]`

```typescript
type ComplianceStatus = 'PENDING' | 'DELAYED' | 'COMPLETED' | 'FILING_DONE';
type ComplianceStage = 'PAYMENT' | 'DOCUMENTATION' | 'GOVT_APPROVAL' | 'FILING_DONE';

interface ComplianceRecord {
  id: string;
  companyName: string;
  serviceType: string;  // e.g. "Annual Filing"
  expertName: string;   // Assigned internal expert
  dueDate: string;      // ISO Date String
  stage: ComplianceStage;
  status: ComplianceStatus;
}
```

### D. Documents (Shared File System)
Used in `/documents`. This is now a shared space between Admins and Super Admins.

**Concept:**
*   **Admins** upload files to a "Shared" space.
*   **Super Admins** can see all files.
*   **Clients** can see files relevant to them.

**Endpoint:** `GET /api/documents`
**Response:** List of documents with metadata.

```typescript
interface Document {
  id: string
  name: string
  date: string // Upload date
  uploader: string // Name of uploader (Admin/User)
  folder: string // 'united', 'legal', etc.
  url: string // Storage URL
}
```

**Upload Endpoint:**
*   `POST /api/documents/upload`
*   **Payload:** Multipart form data (file) + Metadata (Folder, SharedWith).
*   *Note:* Frontend simulates persistence using `localStorage` ("shared_docs"). Backend must implement real storage (S3/GCS).

---

## 4. Frontend Integration Points
*   **API Client**: All mock calls are currently centralized in `src/lib/api.ts`.
*   **Contexts**: 
    *   `SuperAdminContext`: Handles Client/Admin global state.
    *   `CompanyContext`: Handles active company selection.
    *   `AuthContext`: Handles user session.

## 5. Deployment & Environment
*   Create a `.env` file for API base URLs.
*   Ensure CORS is configured to allow requests from the frontend domain.
