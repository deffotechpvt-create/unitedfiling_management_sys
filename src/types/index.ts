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

export interface User {
  name: string;
  role: string;
  avatarUrl?: string;
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
