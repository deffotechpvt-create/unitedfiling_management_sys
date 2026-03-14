export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// -----------------------------------------------------
// Permission Helpers (Based on roles_architecture.html)
// -----------------------------------------------------

// Super Admin Permissions
export const canManageAdmins = (role?: string) => role === ROLES.SUPER_ADMIN;
export const canViewGlobalAnalytics = (role?: string) => role === ROLES.SUPER_ADMIN;

// Admin & Super Admin Permissions
export const canManageCompanies = (role?: string) => role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
export const canUploadDocuments = (role?: string) => role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
export const canUpdateTaskStatus = (role?: string) => role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
export const canManageClients = (role?: string) => role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;
export const canManageConsultations = (role?: string) => role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN;

// Assignment Permissions (SUPER_ADMIN Only)
export const canAssignExperts = (role?: string) => role === ROLES.SUPER_ADMIN;
export const canAssignCompliances = (role?: string) => role === ROLES.SUPER_ADMIN;
export const canAssignClients = (role?: string) => role === ROLES.SUPER_ADMIN;

// User / Client Permissions
export const canManageOwnCompanies = (role?: string) => role === ROLES.USER;
export const canBookConsultation = (role?: string) => role === ROLES.USER;
export const canViewOwnDocuments = (role?: string) => role === ROLES.USER;

// General check
export const isSuperAdmin = (role?: string) => role === ROLES.SUPER_ADMIN;
export const isAdmin = (role?: string) => role === ROLES.ADMIN;
export const isUser = (role?: string) => role === ROLES.USER;

// Reusable Role Matcher for components & routing
export const isRoleAllowed = (userRole?: string, allowedRoles: string[] = []) => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
};
