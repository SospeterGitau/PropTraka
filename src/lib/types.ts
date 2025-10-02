

export type ResidencyStatus = 'resident' | 'non-resident';

export interface Property {
  id: string;
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
  date: string;
  amount: number; // Represents monthly rent for revenue type
  propertyId?: string;
  propertyName: string;
  type: 'revenue' | 'expense';
  category?: string; // e.g., maintenance, repairs, insurance for expenses
  tenant?: string; // for revenue
  tenantEmail?: string; // for revenue
  tenantPhone?: string; // for revenue
  vendor?: string; // for expenses
  deposit?: number; // for revenue
  depositReturned?: boolean; // To track if the deposit has been returned
  amountPaid?: number; // for revenue
  tenancyId?: string; // for revenue, to group monthly payments
  tenancyStartDate?: string; // for revenue
  tenancyEndDate?: string; // for revenue
  contractUrl?: string; // Link to the tenancy agreement
  expenseType?: 'one-off' | 'recurring'; // for expenses
  frequency?: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly'; // for recurring expenses
  notes?: string; // Optional notes field
  receiptUrl?: string; // Optional link to a receipt/file for expenses
  // The following are not part of the core data but can be added for UI purposes
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
