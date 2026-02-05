

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

export interface Company {
  id: string;
  name: string;
  role: string; // e.g., 'Owner'
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
