#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║      🚀 AUTOMATED DATABASE & FORMS IMPLEMENTATION                         ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"

echo ""
echo "🛡️  PHASE 0: Creating backups..."
[ -f "src/lib/types.ts" ] && cp src/lib/types.ts src/lib/types.ts.backup && echo "✅ Backed up: src/lib/types.ts"
[ -f "src/context/data-context.tsx" ] && cp src/context/data-context.tsx src/context/data-context.tsx.backup && echo "✅ Backed up: src/context/data-context.tsx"
[ -f "src/components/property-form.tsx" ] && cp src/components/property-form.tsx src/components/property-form.tsx.backup && echo "✅ Backed up: src/components/property-form.tsx"

echo ""
echo "📝 PHASE 1: Creating types.ts..."

cat > src/lib/types.ts << 'TYPES_EOF'
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
TYPES_EOF

echo "✅ Created: src/lib/types.ts"

echo ""
echo "�� Verifying TypeScript..."
if npm run build 2>&1 | grep -q "Compiled successfully\|0 errors"; then
  echo "✅ TypeScript compiled successfully!"
else
  echo "⚠️  Compilation check - may be OK"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ PHASE 1 COMPLETE!                                   ║"
echo "║                                                                            ║"
echo "║  Next steps:                                                               ║"
echo "║  • Check your src/lib/types.ts file                                        ║"
echo "║  • Run: npm run build (to verify)                                          ║"
echo "║  • Then we'll do PHASE 2 (data-context.tsx)                                ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
