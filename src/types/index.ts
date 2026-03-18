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

export interface OnboardingTasks {
  exploreServices: boolean;
  exploreDocuments: boolean;
  consultExpert: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'INACTIVE';
  avatarUrl?: string;
  onboardingTasks?: OnboardingTasks;
  isOnboardingCompleted?: boolean;
  onboardingData?: any;
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
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateOnboardingTask: (task: keyof OnboardingTasks, completed?: boolean) => Promise<void>;
  completeOnboarding: (data: any) => Promise<void>;
  isAuthenticated: boolean;
}
export type ComplianceStatus = 'PENDING' | 'NEEDS_ACTION' | 'IN_PROGRESS' | 'WAITING_FOR_CLIENT' | 'COMPLETED' | 'DELAYED' | 'OVERDUE' | 'FILING_DONE' | 'PAYMENT_DONE';
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
  benefits?: string[];
  processSteps?: { title: string; description: string }[];
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
  industry?: string;
  memberCount?: number;
  fullAddress?: string;
  myRole?: 'OWNER' | 'EDITOR' | 'VIEWER';
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

// ========================================
// Calendar / Compliance Calendar Types
// ========================================

export type CalendarEventStatus =
  | 'pending'
  | 'needs_action'
  | 'in_progress'
  | 'waiting_for_client'
  | 'completed'
  | 'delayed'
  | 'overdue'
  | 'payment_done'
  | 'filing_done';

export type CalendarServiceType =
  | 'GST'
  | 'TDS'
  | 'INCOME_TAX'
  | 'ROC'
  | 'PROFESSIONAL_TAX'
  | 'ACCOUNTS';

export interface CalendarEvent {
  _id: string;
  client: string | { _id: string; name: string; companyName: string };
  company: string | { _id: string; name: string };
  compliance?: string | null;
  serviceType: CalendarServiceType;
  title: string;
  department: string;
  frequency: 'Monthly' | 'Quarterly' | 'Annual' | 'One-time';
  deadlineDate: string; // ISO format
  completedDate?: string | null;
  status: CalendarEventStatus;
  displayStatus: 'pending' | 'completed' | 'overdue'; // Categorized status for tabs
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  // Virtuals from backend
  daysRemaining?: number;
  isOverdue?: boolean;
}

export interface CalendarApiResponse {
  success: boolean;
  message: string;
  count: number;
  events: CalendarEvent[];
}

export interface CalendarContextType {
  events: CalendarEvent[];
  upcomingEvents: CalendarEvent[];
  loading: boolean;
  error: string | null;
  fetchEvents: (filters?: CalendarFilters & { clientId?: string }) => Promise<void>;
  fetchUpcoming: (days?: number) => Promise<void>;
  updateEventStatus: (id: string, status: CalendarEventStatus) => Promise<void>;
}


export interface CalendarFilters {
  status?: CalendarEventStatus;
  serviceType?: CalendarServiceType;
  year?: number;
}
