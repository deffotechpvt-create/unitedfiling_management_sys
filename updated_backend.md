# 🚀 Complete Backend Architecture Workflow - FINAL CLARITY

Based on:
1. ✅ Our Requirements Discussion
2. ✅ Handoff Documentation  
3. ✅ Architecture Specification

***

## 📋 **Complete Workflow Overview**

### **System Purpose**
Multi-tenant compliance management platform connecting:
- **Business Owners (USER)** ↔ **Compliance Experts (ADMIN)** ↔ **Platform Owner (SUPER_ADMIN)**

***

## 🎭 **User Roles & Access Workflow**

### **1. SUPER_ADMIN (Platform Owner)**

**Scope**: Global - Everything

**Workflow**:
```
1. Manages entire platform
2. Creates ADMIN accounts
3. Creates CLIENT accounts  
4. Assigns CLIENTs to ADMINs (max 10 per admin)
5. Views all data across platform
6. Manages service catalog
7. Views analytics/revenue
```

**Access**:
- ✅ All companies
- ✅ All clients
- ✅ All admins
- ✅ All documents
- ✅ All compliances
- ✅ Platform settings

***

### **2. ADMIN (Compliance Expert)**

**Scope**: Assigned Clients Only (max 10)

**Workflow**:
```
1. Super Admin assigns clients to them
2. Views only assigned clients' data
3. Uploads documents for assigned clients
4. Updates compliance status for assigned clients
5. Handles consultation bookings
6. Cannot see other admins' clients
```

**Access**:
- ✅ Assigned clients only (stored in `managedClients` array)
- ✅ Upload documents for assigned clients
- ✅ Update compliance for assigned clients
- ❌ Cannot create clients
- ❌ Cannot assign clients
- ❌ Cannot see unassigned clients

***

### **3. USER (Business Owner/Client)**

**Scope**: Own Companies Only

**Workflow**:
```
1. Registers on platform (becomes CLIENT)
2. Super Admin assigns them to an ADMIN
3. Creates companies under their account
4. Selects company from header (global context)
5. Views dashboard filtered by selected company
6. Books consultations
7. Views documents uploaded by ADMIN
8. Tracks compliance progress
9. Downloads reports
```

**Access**:
- ✅ Own companies only
- ✅ View documents for own companies
- ✅ View compliances for own companies
- ✅ Book consultations
- ✅ Download reports
- ❌ Cannot upload documents
- ❌ Cannot see other users' data

***

## 🗄️ **Database Models & Relationships**

### **Model Hierarchy**
```
User (SUPER_ADMIN/ADMIN/USER)
  ↓
Client (Represents a USER account)
  ↓ (has many)
Company (Business entities)
  ↓ (has many)
Compliance, Documents, Consultations
```

***

### **1. User Model** (Authentication & Roles)

```javascript
User {
  name: String
  email: String (unique)
  password: String (hashed)
  role: SUPER_ADMIN | ADMIN | USER
  
  // For ADMIN role only:
  managedClients: [ClientId] // Max 10 references
  
  createdAt: Date
}
```

**Purpose**: Authentication and role-based access

**Relationships**:
- ADMIN → has many Clients (max 10) via `managedClients`
- USER → linked to one Client record

***

### **2. Client Model** (Super Admin Context)

```javascript
Client {
  name: String
  companyName: String // Display name
  email: String (unique)
  phone: String
  status: ACTIVE | INACTIVE
  
  // Assignment
  assignedAdmin: UserId (ADMIN) | null
  
  // Metrics
  pendingWork: Number // Count of pending compliances
  completedWork: Number // Count of completed compliances
  
  // Business Entities
  companies: [CompanyId] // Array of companies owned
  
  // User Link
  userId: UserId (USER role) // Link to User account
  
  joinedDate: Date
}
```

**Purpose**: Super Admin manages clients and assigns to admins

**Key Concept**: 
- **1 Client = 1 USER account**
- Client can have **multiple companies**
- **ADMIN's 10-client limit = 10 Client records** (not companies)

**Relationships**:
- Client → assigned to one ADMIN
- Client → has many Companies
- Client → links to one USER

***

### **3. Company Model** (Business Entity)

```javascript
Company {
  name: String
  registrationNumber: String
  email: String
  phone: String
  address: {
    street: String
    city: String
    state: String
    pincode: String
    country: String (default: 'India')
  }
  
  // Ownership
  client: ClientId // Which client owns this
  
  // Members (if multiple users access same company)
  members: [{
    user: UserId
    role: 'Owner' | 'Admin' | 'Viewer' // Company-level role
    addedAt: Date
  }]
  
  status: ACTIVE | INACTIVE
  createdAt: Date
}
```

**Purpose**: Business entities that users manage

**Global Context**: When user selects company from header, all data filters by this company

**Relationships**:
- Company → belongs to one Client
- Company → has many Compliances
- Company → has many Documents
- Company → can have multiple member Users

***

### **4. Compliance Model** (Work Tracking)

```javascript
Compliance {
  // References
  company: CompanyId
  client: ClientId
  service: ServiceId (optional - if service catalog exists)
  
  // Details
  serviceType: String // "Annual Filing", "GST Return"
  expertName: String // Assigned expert display name
  
  // Progress
  stage: PAYMENT | DOCUMENTATION | GOVT_APPROVAL | FILING_DONE
  status: PENDING | DELAYED | COMPLETED | FILING_DONE
  
  // Dates
  startDate: Date
  dueDate: Date
  completedDate: Date
  
  // Assignment
  assignedTo: UserId (ADMIN)
  
  // Additional
  notes: String
  attachments: [String] // File URLs
  
  createdBy: UserId
  updatedBy: UserId
  createdAt: Date
  updatedAt: Date
}
```

**Purpose**: Track compliance work for each company

**Workflow**:
1. Created when service purchased or manually by ADMIN
2. Initially unassigned or auto-assigned to client's ADMIN
3. ADMIN updates stage and status
4. USER tracks progress

***

### **5. Document Model** (File Storage)

```javascript
Document {
  name: String
  url: String // Cloudflare R2 public URL
  folder: String // 'General', 'Legal', 'Tax', etc.
  fileSize: Number
  mimeType: String
  
  // References
  company: CompanyId
  client: ClientId
  relatedCompliance: ComplianceId (optional)
  
  // Audit
  uploadedBy: UserId (ADMIN or SUPER_ADMIN)
  
  createdAt: Date
}
```

**Purpose**: Store file metadata (actual files in Cloudflare R2)

**Upload Flow**:
1. ADMIN/SUPER_ADMIN uploads file
2. File → Cloudflare R2 storage
3. R2 returns public URL
4. Save metadata to MongoDB
5. USER can view/download

***

### **6. Consultation Model** (Booking System)

```javascript
Consultation {
  // User
  user: UserId (CLIENT/USER)
  client: ClientId
  
  // Type
  type: CA | LAWYER // Chartered Accountant or Lawyer
  
  // Tracking
  ticketNumber: String (unique)
  status: PAYMENT_PENDING | SCHEDULED | COMPLETED
  
  // Scheduling
  scheduledSlot: {
    date: Date
    time: String
  }
  
  // Communication
  messages: [{
    sender: 'User' | 'Expert'
    content: String
    timestamp: Date
  }]
  
  // Assignment
  assignedExpert: UserId (ADMIN)
  
  createdAt: Date
}
```

**Purpose**: Consultation booking and chat

**Workflow**:
1. USER books consultation
2. Status: PAYMENT_PENDING
3. Payment verification (OTP)
4. Status: SCHEDULED
5. Expert assigned
6. Chat/messages exchanged
7. Status: COMPLETED

***

### **7. Service Model** (Optional - Catalog)

```javascript
Service {
  title: String
  description: String
  category: 'Licenses' | 'Trademarks' | 'Company Changes' | 'Taxation'
  
  price: {
    amount: Number
    currency: String (default: 'INR')
  }
  
  benefits: [String]
  processSteps: [{
    title: String
    description: String
    order: Number
  }]
  
  thumbnail: String
  duration: String
  isActive: Boolean
  
  createdAt: Date
}
```

**Purpose**: Catalog of purchasable services

***

### **8. Order/Payment Model** (Optional - Payments)

```javascript
Order {
  client: ClientId
  company: CompanyId
  service: ServiceId
  
  amount: Number
  status: CREATED | PENDING | PAID | FAILED | REFUNDED
  
  // Razorpay
  razorpayOrderId: String
  razorpayPaymentId: String
  razorpaySignature: String
  
  // Link to created compliance
  createdCompliance: ComplianceId
  
  createdAt: Date
}
```

**Purpose**: Track payments and orders

***

## 🔄 **Complete User Journeys**

### **Journey 1: New User Registration → Work Assignment**

```
1. USER registers → User record created (role: USER)
2. SUPER_ADMIN creates Client record for this user
3. SUPER_ADMIN assigns Client to an ADMIN
   - Updates Client.assignedAdmin = adminId
   - Adds ClientId to Admin.managedClients array
4. USER creates Company
5. USER selects Company from header
6. Dashboard shows company-specific data
```

***

### **Journey 2: Service Purchase → Compliance Tracking**

```
1. USER browses service catalog
2. USER selects service and company
3. USER makes payment (Razorpay)
4. Payment verified → Order created (status: PAID)
5. Compliance auto-created:
   - company: selected company
   - client: user's client record
   - assignedTo: client's assigned ADMIN
   - status: PENDING
   - stage: PAYMENT
6. ADMIN sees new compliance in dashboard
7. ADMIN updates stage: DOCUMENTATION → GOVT_APPROVAL → FILING_DONE
8. ADMIN uploads documents
9. USER tracks progress in dashboard
10. Compliance status: COMPLETED
```

***

### **Journey 3: Consultation Booking**

```
1. USER clicks "Book Consultation"
2. Selects type: CA or LAWYER
3. Consultation created (status: PAYMENT_PENDING)
4. Ticket number generated
5. Payment/OTP verification
6. Status updated: SCHEDULED
7. ADMIN (expert) assigned
8. Scheduled slot set
9. Chat messages exchanged
10. Consultation completed
```

***

### **Journey 4: Document Upload & Access**

```
1. ADMIN logs in
2. Selects assigned client
3. Uploads document for client's company
4. File → Cloudflare R2
5. Document record created with R2 URL
6. USER logs in
7. Selects company
8. Views documents for selected company
9. Downloads document from R2 URL
```

***

### **Journey 5: Super Admin Managing System**

```
1. SUPER_ADMIN logs in
2. Views global dashboard (all clients, admins, analytics)
3. Creates new ADMIN user
4. Creates new CLIENT record
5. Assigns CLIENT to ADMIN (checks 10-client limit)
6. Views ADMIN utilization (clients assigned, pending work)
7. Reassigns CLIENT to different ADMIN if needed
8. Manages service catalog
9. Views all documents across platform
```

***

## 🔐 **Authentication & Authorization Workflow**

### **Login Flow**
```
1. POST /api/auth/login { email, password }
2. Backend verifies credentials
3. Generates JWT token with payload: { userId, role, clientId (if USER) }
4. Returns { token, user, role }
5. Frontend stores token
6. All subsequent requests include token in header
```

### **Request Authorization**
```
1. Request → authMiddleware extracts token
2. Verifies JWT
3. Attaches user to request: req.user
4. roleCheckMiddleware validates required role
5. companyContextMiddleware (for USER):
   - Extracts companyId from request
   - Verifies user has access to company
6. Controller executes if authorized
```

***

## 📡 **Complete API Structure**

### **Authentication**
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout
PUT    /api/auth/change-password
```

### **Super Admin - Client Management**
```
GET    /api/clients               (List all clients)
POST   /api/clients               (Create client)
GET    /api/clients/:id
PUT    /api/clients/:id
DELETE /api/clients/:id
POST   /api/clients/:id/assign    (Assign to admin)
```

### **Super Admin - Admin Management**
```
GET    /api/admins                (List all admins)
POST   /api/admins                (Create admin)
GET    /api/admins/:id
PATCH  /api/admins/:id/status     (Activate/Deactivate)
GET    /api/admins/:id/utilization (View workload)
```

### **Companies** (Multi-tenancy)
```
GET    /api/companies             (User's companies or all for SUPER_ADMIN)
POST   /api/companies             (Create company)
GET    /api/companies/:id
PUT    /api/companies/:id
DELETE /api/companies/:id
POST   /api/companies/:id/members (Add member)
```

### **Compliances**
```
GET    /api/compliances           (Filtered by role & company context)
POST   /api/compliances           (Create - ADMIN/SUPER_ADMIN)
GET    /api/compliances/:id
PUT    /api/compliances/:id
PUT    /api/compliances/:id/assign (Assign expert)
PUT    /api/compliances/:id/stage  (Update stage)
PUT    /api/compliances/:id/status (Update status)
```

### **Documents**
```
GET    /api/documents             (Filtered by company/client)
POST   /api/documents/upload      (ADMIN/SUPER_ADMIN only)
GET    /api/documents/:id
DELETE /api/documents/:id
GET    /api/documents/:id/download
```

### **Consultations**
```
GET    /api/consultations         (User's consultations)
POST   /api/consultations/book
GET    /api/consultations/:id
POST   /api/consultations/:id/verify-otp
POST   /api/consultations/:id/messages (Add message)
PUT    /api/consultations/:id/schedule
```

### **Services** (Optional)
```
GET    /api/services
GET    /api/services/:id
POST   /api/services              (SUPER_ADMIN only)
PUT    /api/services/:id
DELETE /api/services/:id
```

### **Payments** (Optional)
```
POST   /api/payments/create-order
POST   /api/payments/verify
GET    /api/payments/orders
```

***

## 🎯 **Is This Workflow Clear Now?**

✅ **Roles & Permissions** - Clear  
✅ **Database Models & Relationships** - Clear  
✅ **User Journeys** - Clear  
✅ **API Structure** - Clear  
✅ **Multi-tenancy** - Clear (company context switching)  
✅ **Admin Assignment** - Clear (max 10 clients)  
✅ **File Storage** - Clear (Cloudflare R2)  
✅ **Authentication/Authorization** - Clear (JWT + role middleware)

***

**Ready to start building?** 🚀

Would you like me to:
1. ✅ Create complete backend folder structure with all files
2. ✅ Write all Mongoose schemas
3. ✅ Create all API routes
4. ✅ Build middleware (auth, role check, company context)
5. ✅ Setup Cloudflare R2 integration