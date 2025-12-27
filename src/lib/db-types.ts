
import { Timestamp } from 'firebase/firestore';

// --- Core Data Structures ---

export interface Address {
  street: string;
  city: string;
  state: string; // e.g., 'NY', 'Nairobi'
  zipCode: string; // e.g., '10001', '00100'
  country: string; // e.g., 'USA', 'Kenya'
}

export interface DocumentReference {
  documentName: string;
  documentUrl: string;
  uploadedAt: Timestamp;
}

// --- Collection Interfaces ---

// Properties Collection
export interface Property {
  id?: string; // Firestore Document ID
  ownerId: string; // Foreign key to User
  name: string; // e.g., "Main Street Apartments"
  type: 'Residential' | 'Commercial' | 'Mixed-Use';
  address: Address;
  purchaseDate: Timestamp;
  purchasePrice: number;
  currentValue?: number; // Optional, can be updated
  mortgageBalance?: number; // Optional
  targetRent: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number; // in sq ft or sq meters
  yearBuilt?: number;
  amenities?: string[]; // e.g., ['Pool', 'Gym', 'Parking']
  images?: string[]; // Array of image URLs
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Tenants Collection (NEW)
export interface Tenant {
  id?: string; // Firestore Document ID
  ownerId: string; // Foreign key to User
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth?: Timestamp;
  idType: 'National ID' | 'Passport' | 'Driving License' | 'Other';
  idNumber: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  notes?: string;
  // Auth & Invite fields
  authUserId?: string; // Linked AppUser ID once registered
  invitationStatus?: 'Pending' | 'Accepted' | 'None';

  // Identity 2.0 Fields
  verificationStatus?: 'Unverified' | 'Pending' | 'Verified' | 'Rejected';
  trustScore?: number; // 0-100 indicating confidence level
  identityDocuments?: {
    type: 'ID_FRONT' | 'ID_BACK' | 'PASSPORT' | 'SELFIE';
    url: string;
    status: 'Pending' | 'Verified' | 'Rejected';
    uploadedAt: Timestamp;
  }[];
  worldIdHash?: string; // Store nullifier hash if World ID verified
  vouchingRequests?: {
    voucherEmail: string;
    status: 'Pending' | 'Accepted' | 'Rejected';
    relationship: 'Employer' | 'Previous Landlord' | 'Other';
    requestedAt: Timestamp;
  }[];

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Invitations Collection (NEW)
export interface Invitation {
  id?: string;
  tenantId: string;
  email: string;
  token: string;
  expiresAt: Timestamp;
  used: boolean;
  ownerId: string; // Landlord ID
  createdAt: Timestamp;
}

// Tenancies Collection (NEW)
export interface Tenancy {
  id?: string; // Firestore Document ID
  ownerId: string; // Foreign key to User
  propertyId: string; // Foreign key to Property
  tenantId: string; // Foreign key to Tenant
  startDate: Timestamp;
  endDate: Timestamp;
  rentAmount: number;
  depositAmount: number;
  serviceChargeAmount?: number; // Optional, per payment frequency
  paymentFrequency: 'Monthly' | 'Quarterly' | 'Annually';
  status: 'Active' | 'Ended' | 'Pending' | 'Evicted';
  leaseAgreementUrl?: string; // Reference to a document URL
  moveInChecklistUrl?: string; // Reference to a document URL
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Revenue Collection (Refined Transactions)
export interface RevenueTransaction {
  id?: string; // Firestore Document ID
  ownerId: string; // Foreign key to User
  tenancyId: string; // Foreign key to Tenancy
  propertyId: string; // Foreign key to Property
  amount: number;
  date: Timestamp;
  type: 'Rent' | 'Service Charge' | 'Deposit' | 'Other Income';
  paymentMethod: 'M-Pesa' | 'Bank Transfer' | 'Cash' | 'Credit Card' | 'Other';
  status: 'Paid' | 'Partial' | 'Overdue' | 'Waived';
  invoiceNumber?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Expenses Collection
export interface Expense {
  id?: string; // Firestore Document ID
  ownerId: string; // Foreign key to User
  propertyId?: string; // Optional, if expense is not property-specific
  contractorId?: string; // Optional, if linked to a contractor
  amount: number;
  date: Timestamp;
  category: 'Repairs' | 'Utilities' | 'Insurance' | 'Taxes' | 'Management Fees' | 'Cleaning' | 'Other';
  vendorName?: string; // If no contractorId, or for one-off vendors
  invoiceNumber?: string;
  receiptUrl?: string; // Reference to a document URL
  isRecurring: boolean;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Contractors Collection
export interface Contractor {
  id?: string; // Firestore Document ID
  ownerId: string; // Foreign key to User
  companyName: string;
  contactPersonName: string;
  email: string;
  phoneNumber: string;
  serviceCategories: string[]; // e.g., ['Plumbing', 'Electrical', 'Painting']
  address?: Address; // Optional business address
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// MaintenanceRequests Collection
export interface MaintenanceRequest {
  id?: string; // Firestore Document ID
  ownerId: string; // Foreign key to User
  propertyId: string; // Foreign key to Property
  tenancyId?: string; // Optional, if reported by a specific tenant
  reportedBy: 'Tenant' | 'Owner' | 'Other';
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'New' | 'Assigned' | 'In Progress' | 'Completed' | 'Canceled';
  assignedToContractorId?: string; // Foreign key to Contractor
  scheduledDate?: Timestamp;
  completedDate?: Timestamp;
  cost?: number; // Actual cost of maintenance
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Documents Collection (NEW - for general file storage references)
export interface AppDocument {
  id?: string; // Firestore Document ID
  ownerId: string; // Foreign key to User
  documentName: string;
  documentUrl: string; // URL to the stored file (e.g., Firebase Storage, Google Drive)
  type: 'Lease Agreement' | 'Receipt' | 'ID Scan' | 'Report' | 'Other';
  associatedEntityId?: string; // ID of the entity this document is related to (e.g., propertyId, tenantId)
  associatedEntityType?: 'property' | 'tenant' | 'tenancy' | 'expense' | 'contractor' | 'maintenanceRequest' | 'user'; // Type of entity
  uploadedAt: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Users Collection (NEW - for app-specific user profile data)
export interface AppUser {
  id?: string; // Firebase Auth UID
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  role: 'Landlord' | 'Admin' | 'Tenant'; // e.g., for future features
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// UserSettings Collection (Renamed from 'settings' for clarity and to avoid conflict)
// UserSettings Collection (Renamed from 'settings' for clarity and to avoid conflict)
export type ResidencyStatus = 'resident' | 'non-resident';

export interface UserSettings {
  id?: string; // Firebase Auth UID (same as AppUser.id)
  ownerId: string; // Redundant if id is UID, but good for consistency
  currency: string; // e.g., 'USD', 'KES'
  language: string; // e.g., 'en', 'sw'
  dateFormat: string; // e.g., 'MM/DD/YYYY', 'DD/MM/YYYY'
  locale?: string; // Alias for dateFormat management

  // Profile
  role?: 'Individual Landlord' | 'Property Manager' | 'Real Estate Agent' | 'Investor';
  portfolioSize?: '1-5' | '6-20' | '21-50' | '50+';
  areasOfInterest?: string[];

  // Billing
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingCounty?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  vatPin?: string;

  companyName?: string;
  residencyStatus?: ResidencyStatus;

  isPnlReportEnabled?: boolean;
  isMarketResearchEnabled?: boolean;

  theme: 'light' | 'dark' | 'system';
  emailNotificationsEnabled: boolean;

  // Templates - Flattened or Nested? Keeping consistent with usage in profile-settings-tab
  templateApplicationFormUrl?: string;
  templateLandlordAssessmentFormUrl?: string;
  templateTenancyAgreementUrl?: string;
  templateMoveInChecklistUrl?: string;
  templateMoveOutChecklistUrl?: string;

  documentTemplates?: { // Object of template URLs - Keeping for backward compat if needed
    leaseAgreement?: string;
    applicationForm?: string;
    [key: string]: string | undefined;
  };

  // Subscription
  subscription?: {
    plan: string;
    status: 'active' | 'inactive' | 'past_due';
    nextBillingDate: string;
  };

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// --- Composite Indexes (To be specified in firebase.indexes.json) ---
// Example indexes will be provided in the next step, as they are dependent on common queries.

// --- Sample Data (To be generated programmatically or as JSON files) ---
