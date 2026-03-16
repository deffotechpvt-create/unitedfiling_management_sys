module.exports = {
  // User Roles
  ROLES: {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    USER: 'USER',
  },

  // Status
  STATUS: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
  },

  // Client Status
  CLIENT_STATUS: {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
  },

  // Compliance Status
  COMPLIANCE_STATUS: {
    PENDING: 'PENDING',
    NEEDS_ACTION: 'NEEDS_ACTION',
    IN_PROGRESS: 'IN_PROGRESS',
    WAITING_FOR_CLIENT: 'WAITING_FOR_CLIENT',
    COMPLETED: 'COMPLETED',
    DELAYED: 'DELAYED',
    OVERDUE: 'OVERDUE',
    FILING_DONE: 'FILING_DONE',
    PAYMENT_DONE: 'PAYMENT_DONE',
  },

  // Compliance Stages
  COMPLIANCE_STAGES: {
    PAYMENT: 'PAYMENT',
    DOCUMENTATION: 'DOCUMENTATION',
    GOVT_APPROVAL: 'GOVT_APPROVAL',
    FILING_DONE: 'FILING_DONE',
  },

  // Risk Levels
  RISK_LEVELS: {
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
  },

  // Departments (based on common compliance categories)
  DEPARTMENTS: {
    TAX: 'Direct Tax',
    GST: 'GST',
    ROC: 'Corporate Secretarial',
    HR: 'HR/ Labour Compliance',
    ACCOUNTS: 'Accounts Department',
    OTHER: 'Other',
  },

  // Consultation Types
  CONSULTATION_TYPES: {
    CA: 'CA',
    LAWYER: 'LAWYER',
  },

  CONSULTATION_STATUS: {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  },

  // Company Member Roles
  COMPANY_ROLES: {
    OWNER: 'OWNER',
    EDITOR: 'EDITOR',
    VIEWER: 'VIEWER',
  },

  // Admin Limits
  MAX_CLIENTS_PER_ADMIN: 10,

  // File Upload
  // MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  // ALLOWED_FILE_TYPES: [
  //   'application/pdf',
  //   'image/jpeg',
  //   'image/jpg',
  //   'image/png',
  //   'application/msword',
  //   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // ],

  // // Cloudflare R2
  // R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || 'unitedfillings-documents',

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // Onboarding Tasks
  ONBOARDING_TASKS: {
    EXPLORE_SERVICES: 'exploreServices',
    EXPLORE_DOCUMENTS: 'exploreDocuments',
    CONSULT_EXPERT: 'consultExpert',
  },
};
