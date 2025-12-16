
// General App Types
export interface NavLink {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SettingsTab {
  id: string;
  label: string;
  component: React.ComponentType;
}

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD';

export interface UserSettings {
  currency: Currency | string;
  language?: string;
  dateFormat?: string;
  theme: 'light' | 'dark' | 'system';
  locale?: string;
  residencyStatus?: 'Resident' | 'NonResident' | string;
  role?: 'Individual Landlord' | 'Property Manager' | 'Real Estate Agent' | 'Investor' | string;
  portfolioSize?: '1-5' | '6-20' | '21-50' | '50+' | string;
  areasOfInterest?: string[];
  companyName?: string;
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingCounty?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  vatPin?: string;
  isPnlReportEnabled?: boolean;
  isMarketResearchEnabled?: boolean;
  subscription?: {
    plan?: string;
    startedAt?: string;
    expiresAt?: string;
  };
}

export interface UserData {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  subscriptionPlan?: string;
}

// AI Flow Types
export interface GenerateLeaseClauseInput {
  description: string;
  context?: string;
}

export interface GenerateLeaseClauseOutput {
  clause: string;
  explanation: string;
}

export interface GenerateMarketResearchInput {
  properties_data: string;
  currency: string;
  prompt: string;
}

export interface GenerateMarketResearchOutput {
  report: string | null;
  error?: string | null;
  hint?: string;
}

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
  companyName: string;
  residencyStatus: string;
  prompt: string;
}

export interface GeneratePnlReportOutput {
  report: string | null;
  error?: string | null;
  hint?: string;
}

export interface AnalyzeMaintenanceIssueInput {
  description: string;
  severity: string;
  propertyType?: string;
}

export interface AnalyzeMaintenanceIssueOutput {
  category: string;
  urgency: string;
  estimatedCost: number;
  recommendation: string;
}

export interface CategorizeExpenseInput {
  description: string;
  amount?: number;
}

import type * as DB from './db-types';

export type ServiceCharge = { name: string; amount: number };

export type ResidencyStatus = 'Resident' | 'NonResident' | string;

// Compatibility aliases mapping to canonical DB types in `src/lib/db-types.ts`
export type Expense = DB.Expense & {
  // Backwards-compatible/denormalized fields used across the UI
  tenancyId?: string;
  tenant?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  propertyName?: string;
  rent?: number;
  deposit?: number;
  amountPaid?: number;
  serviceCharges?: Array<{ amount: number; name: string; description?: string }>;
  tenancyStartDate?: any;
  tenancyEndDate?: any;
  rentDueDate?: number;
  contractUrl?: string;
  applicationFormUrl?: string;
  moveInChecklistUrl?: string;
  moveOutChecklistUrl?: string;
  description?: string;
  contractorName?: string;
  vendorName?: string;
  expenseType?: string;
  type?: string; // some callers set `type` on expense objects (e.g., 'revenue')
  frequency?: string;
  // Some UI code calls `new Date(tx.date)` so allow flexible types here
  date?: any;
};
export type RevenueTransaction = DB.RevenueTransaction & {
  // UI compat: some older callers used `tenantId` and allowed 'N/A' as a placeholder payment method
  tenantId?: string;
  paymentMethod?: DB.RevenueTransaction['paymentMethod'] | 'N/A';
  date?: any; // UI code often calls new Date(tx.date)
};

export type Transaction = (DB.RevenueTransaction & {
  type?: 'income' | 'expense';
  // Denormalized fields used across the UI
  tenant?: string;
  propertyName?: string;
  tenancyStartDate?: string;
  tenancyEndDate?: string;
  ownerId?: string;
  notes?: string;
  serviceCharges?: Array<{ name?: string; amount: number; description?: string }>;
  rent?: number;
  deposit?: number;
  amountPaid?: number;
  rentDueDate?: number;
  contractUrl?: string;
  applicationFormUrl?: string;
  moveInChecklistUrl?: string;
  moveOutChecklistUrl?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  date?: any;
}) | Expense;

export type Contractor = DB.Contractor & {
  // Backwards-compatible aliases for older UI code
  name?: string;
  specialty?: string;
  contactNumber?: string;
  phone?: string;
  businessName?: string;
  type?: string;
  rating?: number;
};

export type MaintenanceRequest = DB.MaintenanceRequest & {
  // UI compatibility fields
  title?: string;
  propertyName?: string;
  reportedDate?: string;
  dueDate?: any;
  contractorId?: string;
  contractorName?: string;
  estimatedCost?: number;
  // Accept mixed historical status strings
  status?: DB.MaintenanceRequest['status'] | 'reported' | 'in-progress' | 'pending' | 'assigned' | 'in_progress' | 'completed' | 'on-hold' | 'canceled';
};

// Re-export a few DB-first types for parts of the app that still rely on them
export type Tenant = DB.Tenant;
export type AppDocument = DB.AppDocument;
export interface CategorizeExpenseOutput {
  category: string;
  confidenceScore: number;
}

export interface GenerateReminderEmailInput {
  tenantName: string;
  propertyAddress: string;
  amountOwed: string;
  daysOverdue: number;
  companyName: string;
  arrearsBreakdown: string;
  // Backwards-compatible optional fields (some callers used these previously)
  dueDate?: string;
  amountDue?: number;
  landlordName?: string;
  currency?: string;
}

export interface GenerateReminderEmailOutput {
  subject: string;
  body: string;
}

export interface GetOnboardingPackInput {
  tenantName: string;
  propertyName: string;
  startDate: string;
}

export interface GetOnboardingPackOutput {
  title: string;
  sections: Array<{
    heading: string;
    content: string;
  }>;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

// Data model types
export enum PropertyType {
  Domestic = 'Domestic',
  Commercial = 'Commercial',
}

export const domesticBuildingTypes = [
  'Apartment',
  'House',
  'Condo',
  'Townhouse',
  'Duplex',
  'Terraced House',
  'Bungalow',
];

export const commercialBuildingTypes = [
  'Office',
  'Retail',
  'Industrial',
  'Warehouse',
  'Land',
  'Shopping Centre',
  'Hotel',
];

export interface Address {
  // Accept both legacy `line1` and newer `street` field names from DB shapes
  line1?: string;
  street: string;
  line2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Property {
  id: string;
  ownerId: string; // Match DB canonical type where ownerId is required
  name: string;
  address: Address;
  // Accept both legacy string values and the typed enum
  propertyType?: PropertyType | string;
  // Some parts of the app use `type` instead of `propertyType`
  type: 'Residential' | 'Commercial' | 'Mixed-Use'; // make required and compatible with DB union
  buildingType?: string;
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  sizeUnit?: 'sqft' | 'sqm';
  squareFootage?: number;
  yearBuilt?: number;
  amenities?: string[];
  description?: string;
  purchasePrice?: number;
  purchaseDate?: any;
  marketValue?: number;
  mortgageBalance?: number;
  // Alias used in some pages
  mortgage?: number;
  targetRent?: number;
  status?: 'occupied' | 'vacant' | 'under-maintenance' | string;
  imageUrl?: string;
  imageHint?: string;
  currentValue?: number;
  purchaseTaxes?: number;
  // Compatibility: some UI code expects flattened address fields
  addressLine1?: string;
  city?: string;
  county?: string;
  postalCode?: string;
  rentalValue?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface Tenancy {
  id: string;
  propertyId: string;
  ownerId?: string; // compatibility: some code creates tenancies with ownerId
  tenantId?: string;
  tenantName?: string;
  startDate: any;
  endDate: any;
  rentAmount: number;
  depositAmount?: number;
  serviceChargeAmount?: number; // compatibility: allow quick service charge total on tenancy
  paymentFrequency?: 'Monthly' | 'Quarterly' | 'Annually' | string;
  paymentDay?: number; // legacy field used by parts of the UI
  leaseAgreementUrl?: string;
  moveInChecklistUrl?: string;
  status: 'active' | 'ended' | 'pending' | 'Active' | 'Ended' | 'Pending';
  // Timestamps (compatibility with DB shapes)
  createdAt?: any;
  updatedAt?: any;
}


// Calendar / UI helpers
export interface CalendarEvent {
  id: string;
  title: string;
  // legacy support: some callers use `date` as ISO string
  date?: string;
  start?: string | Date;
  end?: string | Date;
  allDay?: boolean;
  type?: string;
  details?: Record<string, any>;
  meta?: Record<string, any>;
}

export interface ApiKey {
  id: string;
  ownerId: string;
  name: string;
  key: string;
  createdAt: any;
  lastUsed?: any;
}

export interface ArrearEntryCalculated {
  tenancyId: string;
  tenantName: string;
  amountOwed: number;
  daysOverdue: number;
  tenant?: string; // alias used by some components
}

// Chat / AI types
export interface GetChatResponseInput {
  question: string;
  knowledgeBase: string;
}

export interface GetChatResponseOutput {
  answer: string;
  source?: string;
}



export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'data-update' | 'system' | 'user-action';
  message: string;
  userId?: string;
  details?: Record<string, any>;
}

export interface ArrearsSummary {
  totalArrears: number;
  numberOfTenantsInArrears: number;
  longestArrearsDays: number;
}

// Subscription and Billing
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number | null;
  features: string[];
}
