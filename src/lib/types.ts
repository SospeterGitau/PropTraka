// TYPE DEFINITIONS FOR PROPERTY MANAGEMENT SYSTEM
export enum PropertyType { DOMESTIC = 'domestic', COMMERCIAL = 'commercial' }
export enum PaymentMethod { CASH = 'cash', CHEQUE = 'cheque', BANK_TRANSFER = 'bank_transfer', MPESA = 'mpesa', OTHER = 'other' }
export enum TransactionStatus { PAID = 'paid', PENDING = 'pending', OVERDUE = 'overdue', PARTIAL = 'partial' }
export enum ExpenseCategory { MAINTENANCE = 'maintenance', UTILITIES = 'utilities', INSURANCE = 'insurance', SECURITY = 'security', CLEANING = 'cleaning', REPAIRS = 'repairs', TAX = 'tax', OTHER = 'other' }
export enum TenancyStatus { ACTIVE = 'active', TERMINATED = 'terminated', ENDED = 'ended', ON_HOLD = 'on_hold' }
export enum ContractorType { PLUMBER = 'plumber', ELECTRICIAN = 'electrician', CARPENTER = 'carpenter', PAINTER = 'painter', CLEANER = 'cleaner', SECURITY = 'security', GARDENER = 'gardener', GENERAL = 'general' }
export enum MaintenanceStatus { PENDING = 'pending', ASSIGNED = 'assigned', IN_PROGRESS = 'in_progress', COMPLETED = 'completed', CANCELLED = 'cancelled' }
export enum MaintenancePriority { LOW = 'low', MEDIUM = 'medium', HIGH = 'high', URGENT = 'urgent' }
export interface ServiceCharge { name: string; amount: number }
export interface Property { id: string; addressLine1: string; addressLine2?: string; city: string; county: string; postalCode?: string; propertyType: PropertyType; buildingType?: string; bedrooms?: number; bathrooms?: number; size?: number; sizeUnit?: 'sqft' | 'sqm'; purchasePrice?: number; purchaseTaxes?: number; mortgage?: number; currentValue?: number; rentalValue?: number; imageUrl?: string; imageHint?: string; ownerId: string; createdDate?: string; updatedDate?: string; property_value?: number; monthly_rent?: number }
export interface Tenant { id: string; firstName: string; lastName: string; email: string; phone: string; alternatePhone?: string; dateOfBirth?: string; gender?: string; idType?: string; idNumber?: string; currentAddress?: string; city?: string; nextOfKinName?: string; nextOfKinPhone?: string; employmentStatus?: string; employer?: string; employerContact?: string; ownerId: string; createdDate?: string; updatedDate?: string }
export interface Tenancy { id: string; propertyId: string; tenantId: string; leaseStartDate: string; leaseEndDate?: string; rentAmount: number; securityDeposit?: number; paymentFrequency?: 'monthly' | 'quarterly' | 'biannual' | 'annual'; status: TenancyStatus; notes?: string; contractUrl?: string; applicationFormUrl?: string; moveInChecklistUrl?: string; moveOutChecklistUrl?: string; ownerId: string; createdDate?: string; updatedDate?: string }
export interface Transaction { id: string; tenancyId?: string; propertyId?: string; tenantId?: string; rent?: number; serviceCharges?: ServiceCharge[]; deposit?: number; amountPaid?: number; paymentDate?: string; dueDate?: string; paymentMethod?: PaymentMethod; status?: TransactionStatus; receiptNumber?: string; notes?: string; type?: string; rentDueDate?: number; tenancyStartDate?: string; tenancyEndDate?: string; tenant?: string; tenantEmail?: string; tenantPhone?: string; propertyName?: string; contractUrl?: string; applicationFormUrl?: string; moveInChecklistUrl?: string; moveOutChecklistUrl?: string; ownerId: string; createdDate?: string; updatedDate?: string; date?: string; frequency?: string; receiptUrl?: string; contractorName?: string; category?: string; expenseType?: string }
export interface Expense { id: string; propertyId: string; contractorId?: string; category: ExpenseCategory; description: string; amount: number; date: string; invoiceNumber?: string; status?: TransactionStatus; paymentMethod?: PaymentMethod; expenseType?: 'one-off' | 'recurring'; frequency?: string; notes?: string; receiptUrl?: string; ownerId: string; createdDate?: string; updatedDate?: string; propertyName?: string; contractorName?: string }
export interface Contractor { id: string; name: string; type: ContractorType; email?: string; phone?: string; alternatePhone?: string; businessName?: string; address?: string; city?: string; taxId?: string; businessLicense?: string; specialization?: string[]; rating?: number; totalJobsDone?: number; averageResponseTime?: string; isActive?: boolean; ownerId: string; createdDate?: string; updatedDate?: string; lastUsedDate?: string }
export interface MaintenanceRequest { id: string; propertyId: string; contractorId?: string; title: string; description: string; category?: string; priority?: MaintenancePriority; status: MaintenanceStatus; reportedDate: string; reportedBy?: string; assignedDate?: string; completionDate?: string; estimatedCost?: number; actualCost?: number; notes?: string; photos?: string[]; ownerId: string; createdDate?: string; updatedDate?: string; propertyName?: string; contractorName?: string }
export interface UserSettings { currency: string; locale: string; companyName?: string; residencyStatus?: string; isPnlReportEnabled?: boolean; isMarketResearchEnabled?: boolean; theme?: 'light' | 'dark' | 'system'; role?: string }

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
  diagnosis: string;
  recommendations: string[];
  urgency: string;
  estimatedCost?: string;
}

export interface GenerateMaintenanceGuideInput {
  propertyType: string;
  maintenanceType: string;
}

export interface GenerateMaintenanceGuideOutput {
  title: string;
  steps: string[];
  tips: string[];
  estimatedTime: string;
}

// Reminder Email Types
export interface GenerateReminderEmailInput {
  tenantName: string;
  propertyAddress: string;
  amountOwed: string;
  daysOverdue: number;
  companyName: string;
  arrearsBreakdown: string;
}

export interface GenerateReminderEmailOutput {
  subject: string;
  body: string;
}

// Chat Response Types
export interface GetChatResponseInput {
  question: string;
  knowledgeBase: string;
}

export interface GetChatResponseOutput {
  answer: string;
}

// Report Summary Types
export interface GenerateReportSummaryInput {
  summary: string;
}

export interface GenerateReportSummaryOutput {
  summary: string;
}

// Knowledge Article Types
export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
}

// Categorize Expense Types
export interface CategorizeExpenseInput {
  description: string;
}

export interface CategorizeExpenseOutput {
  category: string;
}

// Change Log Entry Type
export interface ChangeLogEntry {
  id: string;
  type: string;
  action: string;
  description: string;
  entityId: string;
  ownerId: string;
  date: any;
}

// Arrear Entry Type
export interface ArrearEntry {
  id: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  amountOwed: number;
  daysOverdue: number;
  lastPaymentDate?: string;
  nextDueDate?: string;
  rentDueDate: number;
}

// Arrear Entry Calculated Type
export interface ArrearEntryCalculated {
  tenant: string;
  tenantEmail: string;
  tenantPhone: string;
  propertyAddress: string | undefined;
  amountOwed: number;
  dueDate: string;
  daysOverdue: number;
  breakdown: string;
}

// Calendar Event Type
export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  date: string | undefined;
  type: 'maintenance' | 'rent_due' | 'inspection' | 'tenancy-start' | 'tenancy-end' | 'expense' | 'other';
  propertyId?: string;
  propertyName?: string;
  tenantId?: string;
  tenantName?: string;
  details?: Record<string, any>;
}
