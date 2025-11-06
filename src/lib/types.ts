
export type ResidencyStatus = 'resident' | 'non-resident';

export interface Property {
  id: string;
  ownerId: string; // Foreign key to the user
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  propertyType: 'Domestic' | 'Commercial';
  buildingType: | 'Studio' | 'Terraced House' | 'Semi-Detached House' | 'Detached House' | 'Bungalow' | 'Flat' | 'Maisonette' | 'Office' | 'Retail' | 'Industrial' | 'Other';
  bedrooms: number;
  bathrooms: number;
  size?: number;
  sizeUnit?: 'sqft' | 'sqm';
  purchasePrice: number;
  mortgage: number;
  currentValue: number;
  rentalValue: number;
  purchaseTaxes?: number;
  imageUrl: string | null;
  imageHint: string;
}

export interface Transaction {
  id: string;
  ownerId: string; // Foreign key to the user
  date: string;
  amount: number;
  propertyId?: string;
  propertyName: string;
  type: 'revenue' | 'expense';
  category?: string;
  tenant?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  vendor?: string;
  deposit?: number;
  depositReturned?: boolean;
  amountPaid?: number;
  tenancyId?: string;
  tenancyStartDate?: string;
  tenancyEndDate?: string;
  contractUrl?: string;
  expenseType?: 'one-off' | 'recurring';
  frequency?: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly';
  notes?: string;
  receiptUrl?: string;
  transactions?: Transaction[]; 
  nextDueDate?: string;
}

export interface Arrear {
  tenant: string;
  propertyAddress: string;
  amount: number;
  dueDate: string;
}

export interface CalendarEvent {
  date: string;
  title: string;
  type: 'appointment' | 'tenancy-start' | 'tenancy-end' | 'expense';
  details?: Record<string, string | number | undefined>;
}

export interface ChangeLogEntry {
  id: string;
  ownerId: string; // Foreign key to the user
  date: string;
  type: 'Property' | 'Tenancy' | 'Expense' | 'Payment' | 'Maintenance';
  action: 'Created' | 'Updated' | 'Deleted';
  description: string;
  entityId: string;
}

export interface MaintenanceRequest {
  id: string;
  ownerId: string; // Foreign key to the user
  propertyId?: string;
  propertyName: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Done' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  reportedDate: string;
  completedDate?: string;
  cost?: number;
}

// AI Flow Types
export interface GenerateReportSummaryInput {
  summary: string;
}

export interface GenerateReportSummaryOutput {
  summary: string;
}

export interface GeneratePnlReportInput {
  startDate: string;
  endDate: string;
  revenueTransactions: string;
  expenseTransactions: string;
  currency: string;
  companyName?: string;
  residencyStatus: ResidencyStatus;
}

export interface GeneratePnlReportOutput {
  report: string | null;
  error?: string | null;
  hint?: string | null;
}

export interface GenerateMarketResearchInput {
  properties: string; // JSON string of Property[]
  currency: string;
}

export interface GenerateMarketResearchOutput {
  report: string | null;
  error?: string | null;
  hint?: string | null;
}
