

/**
 * @fileoverview This file contains all the TypeScript type definitions and interfaces
 * used across the application. Centralising these types helps ensure data consistency,
 * improves code readability, and provides strong typing for props, state, and API responses.
 */


/**
 * Represents the context for a Firestore security rule evaluation.
 * This is used to construct detailed error messages for debugging.
 */
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

/**
 * Represents the tax residency status of the user, affecting P&L calculations.
 */
export type ResidencyStatus = 'resident' | 'non-resident';

/**
 * Represents a single article in the AI's knowledge base.
 */
export interface KnowledgeArticle {
  id: string;
  ownerId?: string;
  title: string;
  content: string;
}

/**
 * Represents a single real estate property in the user's portfolio.
 */
export interface Property {
  id: string;
  ownerId?: string; // Foreign key to the user
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

/**
 * Represents a fixed or variable service charge associated with a tenancy invoice.
 */
export interface ServiceCharge {
  name: string;
  amount: number;
}

/**
 * Represents a single financial transaction, which can be either revenue or an expense.
 * It's a versatile interface used for tracking all financial movements.
 */
export interface Transaction {
  id: string;
  ownerId?: string; // Foreign key to the user
  date: string; // ISO date string (YYYY-MM-DD)
  rent: number; // Base rent amount due for a period (used in revenue)
  serviceCharges?: ServiceCharge[]; // Additional charges for a period (used in revenue)
  propertyId?: string;
  propertyName: string;
  type: 'revenue' | 'expense';
  category?: string; // e.g., 'Repairs', 'Insurance' (used in expenses)
  
  // Tenancy-related fields (primarily for revenue)
  tenant?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  deposit?: number;
  depositReturned?: boolean;
  amountPaid?: number; // The actual amount paid for a revenue transaction
  tenancyId?: string; // A unique identifier for a group of related tenancy transactions
  tenancyStartDate?: string;
  tenancyEndDate?: string;
  contractUrl?: string;

  // Expense-related fields
  contractorId?: string;
  contractorName?: string;
  expenseType?: 'one-off' | 'recurring';
  frequency?: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly';
  notes?: string;
  receiptUrl?: string;
  
  // Fields for internal component state or data aggregation
  transactions?: Transaction[]; // Used to group transactions within a tenancy
  nextDueDate?: string; // Calculated field for UI display
  amount?: number; // Legacy/general amount field, primarily for expenses
}

/**
 * Represents a calculated entry showing a tenant's outstanding rental arrears.
 */
export interface ArrearEntry {
  tenant: string;
  tenantEmail: string;
  tenantPhone: string;
  propertyAddress: string;
  amountOwed: number;
  dueDate: string;
  rentOwed: number;
  depositOwed: number;
  daysOverdue: number;
  serviceChargesOwed: number;
}

/**
 * Represents a request for maintenance on a property.
 */
export interface MaintenanceRequest {
  id: string;
  ownerId?: string; // Foreign key to the user
  propertyId?: string;
  propertyName: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Done' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  reportedDate: string;
  completedDate?: string;
  cost?: number;
  contractorId?: string;
  contractorName?: string;
}

/**
 * Represents a contractor or vendor who provides services.
 */
export interface Contractor {
  id: string;
  ownerId?: string; // Foreign key to the user
  name: string;
  specialty: string;
  email?: string;
  phone?: string;
  notes?: string;
}

/**
 * Represents a subscription plan's details from the static configuration.
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number | null;
  price_per_unit?: number;
  unit_range: string;
  description: string;
  features: string[];
  transaction_limit: number;
  support_level: string;
}

/**
 * Represents a feature available in the application.
 */
export interface AppFeature {
    id: string;
    name: string;
    description: string;
    page_url: string | null;
}

/**
 * Represents the user's subscription plan details stored in Firestore.
 */
export interface Subscription {
  id: string;
  ownerId?: string;
  plan: 'Free' | 'Starter' | 'Growth' | 'Professional' | 'Enterprise';
  status: 'active' | 'trial' | 'cancelled' | 'overdue' | 'past_due';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  units_managed?: number;
  payment_customer_id?: string; // For IntaSend API
  next_billing_date?: string;    // For IntaSend API
  last_payment_status?: string; // For IntaSend API
}

/**
 * Represents a payment request (invoice) sent to a tenant.
 */
export interface Invoice {
  id: string;
  ownerId?: string;
  tenancyId: string;
  revenueTransactionId: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  paymentGateway: 'Pesapal' | 'InstaSend' | 'M-Pesa';
  gatewayTransactionId?: string;
  dateCreated: string;
  datePaid?: string;
}

/**
 * Represents a message in the AI chat interface.
 */
export interface ChatMessage {
  id: string;
  ownerId?: string; // Foreign key to the user
  role: 'user' | 'model';
  content: string;
  timestamp: any; // Firestore ServerTimestamp
}

/**
 * @deprecated This type is deprecated. Use `ArrearEntry` instead.
 */
export interface Arrear {
  tenant: string;
  propertyAddress: string;
  amount: number;
  dueDate: string;
}

/**
 * Represents a single event to be displayed on the calendar component.
 */
export interface CalendarEvent {
  date: string;
  title: string;
  type: 'appointment' | 'tenancy-start' | 'tenancy-end' | 'expense';
  details?: Record<string, string | number | undefined>;
}

/**
 * Represents an entry in the activity changelog.
 */
export interface ChangeLogEntry {
  id: string;
  ownerId?: string; // Foreign key to the user
  date: string;
  type: 'Property' | 'Tenancy' | 'Expense' | 'Payment' | 'Maintenance' | 'Contractor' | 'Subscription' | 'User';
  action: 'Created' | 'Updated' | 'Deleted';
  description: string;
  entityId: string;
}

export interface UserSettings {
    currency: string;
    locale: string;
    companyName: string;
    residencyStatus: ResidencyStatus;
    isPnlReportEnabled: boolean;
    isMarketResearchEnabled: boolean;
    subscription?: Subscription | null;
    theme?: 'dark' | 'light' | 'system';
    role?: 'Individual Landlord' | 'Property Manager' | 'Real Estate Agent' | 'Investor';
    portfolioSize?: '1-5' | '6-20' | '21-50' | '50+';
    areasOfInterest?: string[];
    billingAddressLine1?: string;
    billingAddressLine2?: string;
    billingCity?: string;
    billingCounty?: string;
    billingPostalCode?: string;
    billingCountry?: string;
    vatPin?: string;
}

// ====== AI Flow Types ======

/**
 * Input for the `generateReportSummary` AI flow.
 */
export interface GenerateReportSummaryInput {
  summary: string;
}

/**
 * Output for the `generateReportSummary` AI flow.
 */
export interface GenerateReportSummaryOutput {
  summary: string;
}

/**
 * Input for the `generatePnlReport` AI flow.
 */
export interface GeneratePnlReportInput {
  startDate: string;
  endDate: string;
  revenueTransactions: string;
  expenseTransactions: string;
  currency: string;
  companyName?: string;
  residencyStatus: ResidencyStatus;
  prompt: string;
  isResident: boolean;
  isNonResident: boolean;
}

/**
 * Output for the `generatePnlReport` AI flow.
 */
export interface GeneratePnlReportOutput {
  report: string | null;
  error?: string | null;
  hint?: string | null;
}

/**
 * Input for the `generateMarketResearch` AI flow.
 */
export interface GenerateMarketResearchInput {
  properties: string; // JSON string of Property[]
  currency: string;
  prompt: string;
}

/**
 * Output for the `generateMarketResearch` AI flow.
 */
export interface GenerateMarketResearchOutput {
  report: string | null;
  error?: string | null;
  hint?: string | null;
}
