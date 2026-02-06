export interface Client {
  _id: string;
  name: string;
  companyName: string;
  email?: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  assignedAdmin?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  pendingWork: number;
  completedWork: number;
  joinedDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'INACTIVE';
  avatarUrl?: string; // Added from your existing type
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}
export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}
export type ComplianceStatus = 'PENDING' | 'DELAYED' | 'COMPLETED' | 'FILING_DONE';
export type ComplianceStage = 'PAYMENT' | 'DOCUMENTATION' | 'GOVT_APPROVAL' | 'FILING_DONE';

export interface ComplianceRecord {
  id: string;
  companyName: string;
  serviceType: string;
  expertName: string;
  dueDate: string; // ISO format
  stage: ComplianceStage;
  status: ComplianceStatus;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  category: 'Licenses' | 'Trademarks' | 'Company Changes' | 'Taxation';
  price: string;
  benefits: string[];
  processSteps: { title: string; description: string }[];
}

export interface Document {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size?: string;
  updatedAt: string;
  children?: Document[];
}


// ========================================
// Types & Interfaces
// ========================================

export interface Address {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
}

export interface CompanyMember {
    _id?: string;
    user: {
        _id: string;
        name: string;
        email: string;
        role: string;
    } | string;
    role: 'OWNER' | 'EDITOR' | 'VIEWER';
    addedAt?: Date;
}

export interface Company {
    _id: string;
    name: string;
    registrationNumber?: string;
    email?: string;
    phone?: string;
    address?: Address;
    client: {
        _id: string;
        name: string;
        companyName?: string;
        email: string;
        phone?: string;
        status: string;
    } | string;
    members: CompanyMember[];
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
    memberCount?: number;
    fullAddress?: string;
}

export interface CompanyStats {
    totalCompanies: number;
    activeCompanies: number;
    inactiveCompanies: number;
    companiesWithMembers: number;
    companiesWithoutMembers: number;
}

export interface CompanyFilters {
    status?: 'ACTIVE' | 'INACTIVE';
    client?: string;
    search?: string;
}

export interface CreateCompanyData {
    name: string;
    registrationNumber?: string;
    email?: string;
    phone?: string;
    address?: Address;
    client: string;
    members?: {
        user: string;
        role: 'OWNER' | 'EDITOR' | 'VIEWER';
    }[];
}

export interface UpdateCompanyData {
    name?: string;
    registrationNumber?: string;
    email?: string;
    phone?: string;
    address?: Address;
    status?: 'ACTIVE' | 'INACTIVE';
}

export interface AddMemberData {
    userId: string;
    role: 'OWNER' | 'EDITOR' | 'VIEWER';
}

export interface UpdateMemberRoleData {
    role: 'OWNER' | 'EDITOR' | 'VIEWER';
}