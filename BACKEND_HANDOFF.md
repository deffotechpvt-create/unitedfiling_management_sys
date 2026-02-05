# Backend Architecture & API Specification
**Project:** United Fillings Compliance Platform
**Version:** 1.0
**Date:** February 3, 2026

---

## 1. Executive Summary

This document serves as the technical handbook for the backend implementation of the United Fillings platform. The system is designed as a centralized compliance management dashboard that connects Business Owners (Users) with Compliance Experts (Admins), overseen by a Super Admin.

The backend will be built using the **MERN Stack** (MongoDB, Express.js, React, Node.js) to ensure scalability and maintain consistency with the JavaScript-based frontend.

---

## 2. Technology Stack

The following core technologies have been selected for the implementation:

*   **Runtime Environment:** Node.js (LTS Version)
*   **Web Framework:** Express.js
*   **Database:** MongoDB (via MongoDB Atlas)
*   **ODM:** Mongoose
*   **Authentication:** JSON Web Tokens (JWT) with bcrypt encryption
*   **File Storage:** Cloudflare R2 (S3-Compatible Object Storage)

---

## 3. User Roles & Permissions (RBAC)

The system enforces strict Role-Based Access Control. Using middleware, the API must validate the role of the requesting user before processing sensitive actions.

### Super Admin (Global Scope)
The highest level of privilege, intended for the platform owners.
*   **Access Level:** Global (All Data)
*   **Key Capabilities:**
    *   Create and manage internal Admin accounts.
    *   View and edit all Client and Company data.
    *   Assign Clients to specific Admins for management.
    *   Access global revenue and performance analytics.

### Admin (Restricted Scope)
Intended for internal staff or compliance experts and operational managers.
*   **Access Level:** Assigned Clients Only
*   **Key Capabilities:**
    *   View detailed compliance status for assigned clients.
    *   Upload tax filings and legal documents on behalf of the client.
    *   Update the status of compliance tasks (e.g., changing status from "Pending" to "Completed").

### User (Private Scope)
Intended for the end-clients (Business Owners).
*   **Access Level:** Personal Data Only
*   **Key Capabilities:**
    *   View the dashboard for their own companies.
    *   Book consultations with experts.
    *   Download reports and view uploaded documents.
    *   **Restriction:** Users cannot view internal notes or other clients' data.

---

## 4. Database Schema Design

The database will be structured using Mongoose schemas. Below are the definitions for the core entities.

### 4.1 Users & Authentication
Stores login credentials and system roles.
```javascript
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Encrypted string
  role: { type: String, enum: ['SUPER_ADMIN', 'ADMIN', 'USER'], default: 'USER' },
  
  // For Admins only: References to clients they are responsible for
  managedClients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Client' }],
  createdAt: { type: Date, default: Date.now }
});
```

### 4.2 Clients (Super Admin Context)
Represents the human point of contact or the account holder.
```javascript
const ClientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  companyName: { type: String, required: true }, // Display name
  email: { type: String, unique: true },
  phone: String,
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  
  // The Admin responsible for this client
  assignedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
  // Metrics for dashboard
  pendingWork: { type: Number, default: 0 },
  completedWork: { type: Number, default: 0 },
  
  // Link to actual business entities
  companies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company' }],
  joinedDate: { type: Date, default: Date.now }
});
```

### 4.3 Consultations (Booking System)
Manages the flow of booking appointments with experts.
```javascript
const ConsultationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['CA', 'LAWYER'], required: true },
  
  // Operational Details
  ticketNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ['PAYMENT_PENDING', 'SCHEDULED', 'COMPLETED'], default: 'PAYMENT_PENDING' },
  
  // Scheduling
  scheduledSlot: {
    date: Date,
    time: String
  },
  
  // Communication Log
  messages: [{
    sender: { type: String, enum: ['User', 'Expert'] },
    content: String,
    timestamp: { type: Date, default: Date.now }
  }]
});
```

### 4.4 Documents
Stores metadata for files uploaded to Cloudflare R2.
```javascript
const DocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true }, // Public URL from Cloudflare
  folder: { type: String, default: 'General' },
  
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  createdAt: { type: Date, default: Date.now }
});
```

---

## 5. API Specification & Endpoints

### Authentication
*   `POST /api/auth/login`: Authenticates user and returns a JWT.
*   `GET /api/auth/me`: Validates the session and returns user profile.

### Consultation Module
*   `POST /api/consultations/book`: Initiates a new booking. Sets status to 'PAYMENT_PENDING'.
*   `POST /api/consultations/:id/verify-otp`: confirm booking validity. Updates status to 'SCHEDULED'.
*   `GET /api/consultations`: Retrieves history for the logged-in user.
*   `GET /api/consultations/:id`: Retrieves detailed timeline and messages.

### Document Management
*   `POST /api/documents/upload`: Accepts multipart form data. Uploads to storage provider and saves metadata.
*   `GET /api/documents`: Lists documents filtered by folder or company.

---

## 6. Implementation Guidelines

### File Upload Workflow
To maintain performance and keep the database lean, we utilize Cloudflare R2 for file storage.
1.  **Ingestion:** The API receives the file via `multer` middleware.
2.  **Storage:** The backend uses the AWS SDK to stream the file to the R2 bucket.
3.  **Reference:** Once uploaded, R2 provides a public URL (e.g., `https://files.unitedfillings.com/uploads/doc.pdf`).
4.  ** Persistence:** This URL is stored in the MongoDB `Document` collection, not the file itself.

### Development Phases
1.  **Setup:** Initialize the Express project and connect to MongoDB Atlas.
2.  **Auth Layer:** Implement User models and JWT middleware.
3.  **Core Logic:** Build the Client and Compliance CRUD operations.
4.  **Features:** Implement the Consultation booking flow and File Uploads.
