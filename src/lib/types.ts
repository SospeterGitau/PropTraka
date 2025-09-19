export interface Property {
  id: string;
  address: string;
  purchasePrice: number;
  mortgage: number;
  currentValue: number;
  rentalValue: number;
  imageUrl: string;
  imageHint: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  propertyId: string;
  propertyName: string;
  type: 'revenue' | 'expense';
  category?: string; // e.g., maintenance, repairs, insurance for expenses
  tenant?: string; // for revenue
  vendor?: string; // for expenses
  deposit?: number; // for revenue
  amountPaid?: number; // for revenue
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
  type: 'appointment' | 'tenancy-start' | 'tenancy-end';
}
