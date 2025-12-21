
import type * as DB from './db-types';

// --- General App Types ---
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

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'KES';

export type ResidencyStatus = 'Resident' | 'NonResident' | string;

// --- User Settings ---
export interface UserSettings extends Omit<DB.UserSettings, 'createdAt' | 'updatedAt' | 'subscription'> {
  // UI Overrides
  createdAt: string;
  updatedAt: string;
  subscription?: {
    plan?: string;
    startedAt?: string;
    expiresAt?: string;
  };
  // Explicitly include optional fields for better DX
  residencyStatus?: ResidencyStatus;
  role?: string;
  portfolioSize?: string;
  areasOfInterest?: string[];
  paymentAutomation?: {
    enabled: boolean;
    provider: 'pesapal' | 'manual';
    autoVerify: boolean;
  };
  paymentConfig?: any; // For new payment settings overrides
  language?: string;
  notificationPreferences?: {
    rentDueReminderDays: number;
    sendReceipts: boolean;
    sendLateNotices: boolean;
  };
  notificationTemplates?: {
    rentDueEmail?: string;
    paymentReceiptEmail?: string;
  };
}

export interface UserData {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  subscriptionPlan?: string;
}

// --- Domain Entities (Client/UI View) ---
// These types represent data *after* it has been fetched and serialized for the UI.
// Dates are strings (ISO) or Date objects, not Firestore Timestamps.

export type Address = DB.Address & {
  line1?: string; // Compat
  line2?: string;
};

export interface Property extends Omit<DB.Property, 'createdAt' | 'updatedAt' | 'purchaseDate' | 'type'> {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  purchaseDate?: string; // ISO Date

  // Enforce consistent Type usage
  type: 'Residential' | 'Commercial' | 'Mixed-Use';
  propertyType?: string; // Compat alias

  // UI/Computed Fields
  status?: 'occupied' | 'vacant' | 'under-maintenance' | string;
  imageHint?: string;
  imageUrl?: string; // Allow null in DB but string in UI (optional)

  // Compatibility / Flattened Fields
  addressLine1?: string;
  city?: string;
  county?: string;
  postalCode?: string;
  description?: string;
  rentalValue?: number;
  mortgage?: number; // Alias for mortgageBalance
  size?: number; // Alias
  sizeUnit?: 'sqft' | 'sqm';
  buildingType?: string; // Alias
}

export interface Tenant extends Omit<DB.Tenant, 'createdAt' | 'updatedAt' | 'dateOfBirth'> {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  dateOfBirth?: string;
}

export interface Tenancy extends Omit<DB.Tenancy, 'createdAt' | 'updatedAt' | 'startDate' | 'endDate' | 'ownerId'> {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  startDate: string;
  endDate: string;

  // UI/Denormalized Fields
  tenantName?: string;
  propertyName?: string; // Loaded via join
  ownerId?: string;
  status: 'Active' | 'Ended' | 'Pending'; // Normalized case
}

export interface Expense extends Omit<DB.Expense, 'createdAt' | 'updatedAt' | 'date'> {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  date: string; // ISO

  // UI/Denormalized Fields
  propertyName?: string;
  tenantName?: string;
  status?: string;

  // Compat aliases
  expenseType?: string;
  type?: string;
  frequency?: string;
  description?: string;
  contractorName?: string;
}

export interface RevenueTransaction extends Omit<DB.RevenueTransaction, 'createdAt' | 'updatedAt' | 'date'> {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  date: string; // ISO

  // UI Compat
  tenantId?: string; // older callers might use this
  propertyName?: string;
}

export interface ServiceCharge {
  name: string;
  amount: number;
}

export type Transaction = (RevenueTransaction & { type: 'revenue' | 'income' }) | (Expense & { type?: 'expense' });

export interface MaintenanceRequest extends Omit<DB.MaintenanceRequest, 'createdAt' | 'updatedAt' | 'scheduledDate' | 'completedDate'> {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  scheduledDate?: string;
  completedDate?: string;

  // UI Compat
  title?: string;
  propertyName?: string;
  dueDate?: string;
  contractorName?: string;
  contractorId?: string;
  estimatedCost?: number;
}

export interface Contractor extends Omit<DB.Contractor, 'createdAt' | 'updatedAt'> {
  id: string;
  createdAt?: string;
  updatedAt?: string;

  // Compat
  name?: string; // alias for companyName or contactPersonName
  specialty?: string;
  phone?: string;
  businessName?: string;
}

export type AppDocument = DB.AppDocument;

// --- AI & Features ---

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

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

export interface GetChatResponseInput {
  question: string;
  knowledgeBase: string;
}

export interface GetChatResponseOutput {
  answer: string;
  source?: string;
}

export interface ApiKey {
  id: string;
  ownerId: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
}

export interface ArrearEntryCalculated {
  tenancyId: string;
  tenantName: string;
  amountOwed: number;
  daysOverdue: number;
  tenant?: string;
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

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number | null;
  features: string[];
}

// --- Calendar ---
export interface CalendarEvent {
  id: string;
  title: string;
  date?: string;
  start?: string | Date;
  end?: string | Date;
  allDay?: boolean;
  type?: string;
  details?: Record<string, any>;
  meta?: Record<string, any>;
}
