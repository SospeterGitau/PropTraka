export interface Property {
  id: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  propertyType: 'Domestic' | 'Commercial';
  buildingType: | 'Terraced House' | 'Semi-Detached House' | 'Detached House' | 'Bungalow' | 'Flat' | 'Maisonette' | 'Office' | 'Retail' | 'Industrial' | 'Warehouse' | 'Land' | 'Other';
  bedrooms: number;
  bathrooms: number;
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
  vendor?: string; // for expenses
  deposit?: number; // for revenue
  amountPaid?: number; // for revenue
  tenancyId?: string; // for revenue, to group monthly payments
  tenancyStartDate?: string; // for revenue
  tenancyEndDate?: string; // for revenue
  contractUrl?: string; // Link to the tenancy agreement
  expenseType?: 'one-off' | 'recurring'; // for expenses
  frequency?: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly'; // for recurring expenses
  notes?: string; // Optional notes field
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
}

export interface GeneratePnlReportOutput {
  report: string | null;
  error?: string | null;
  hint?: string | null;
}
