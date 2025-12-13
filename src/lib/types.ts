
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
  currency: Currency;
  language: string;
  dateFormat: string;
  theme: 'light' | 'dark' | 'system';
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
  amount: number;
}

export interface CategorizeExpenseOutput {
  category: string;
  confidenceScore: number;
}

export interface GenerateReminderEmailInput {
  tenantName: string;
  dueDate: string;
  amountDue: number;
  landlordName: string;
  propertyAddress: string;
  currency: string;
}

export interface GenerateReminderEmailOutput {
  subject: string;
  body: string;
}

export interface GetChatResponseInput {
  messages: Array<{ role: string; content: string }>;
  context?: string;
}

export interface GetChatResponseOutput {
  message: {
    role: string;
    content: string;
  };
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
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Property {
  id: string;
  name: string;
  address: Address;
  propertyType: PropertyType;
  buildingType: string;
  bedrooms: number;
  bathrooms: number;
  size?: number;
  sizeUnit?: 'sqft' | 'sqm';
  purchasePrice?: number;
  purchaseDate?: string;
  marketValue?: number;
  mortgageBalance?: number;
  targetRent?: number;
  status: 'occupied' | 'vacant' | 'under-maintenance';
  imageUrl?: string;
}

export interface Tenancy {
  id: string;
  propertyId: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  paymentDay: number;
  status: 'active' | 'ended' | 'pending';
}

export interface Transaction {
  id: string;
  propertyId: string;
  tenancyId?: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description?: string;
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  description: string;
  status: 'reported' | 'in-progress' | 'completed' | 'on-hold';
  reportedDate: string;
  completedDate?: string;
  priority: 'low' | 'medium' | 'high';
  cost?: number;
  contractorId?: string;
}

export interface Contractor {
  id: string;
  name: string;
  specialty: string;
  contactNumber: string;
  email?: string;
  rating?: number;
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
  price: number;
  features: string[];
}
