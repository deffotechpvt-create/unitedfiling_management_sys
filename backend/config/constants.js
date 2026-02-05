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
    DELAYED: 'DELAYED',
    COMPLETED: 'COMPLETED',
    FILING_DONE: 'FILING_DONE',
  },

  // Compliance Stages
  COMPLIANCE_STAGES: {
    PAYMENT: 'PAYMENT',
    DOCUMENTATION: 'DOCUMENTATION',
    GOVT_APPROVAL: 'GOVT_APPROVAL',
    FILING_DONE: 'FILING_DONE',
  },

  // Consultation Types
  CONSULTATION_TYPES: {
    CA: 'CA',
    LAWYER: 'LAWYER',
  },

  // Consultation Status
  CONSULTATION_STATUS: {
    PAYMENT_PENDING: 'PAYMENT_PENDING',
    SCHEDULED: 'SCHEDULED',
    COMPLETED: 'COMPLETED',
  },

  // Company Roles
  COMPANY_ROLES: {
    OWNER: 'Owner',
    ADMIN: 'Admin',
    VIEWER: 'Viewer',
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
};
