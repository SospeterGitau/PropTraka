
import type { Property, Transaction, Arrear, CalendarEvent, ChangeLogEntry } from './types';

export const properties: Property[] = [
  { id: 'p1', addressLine1: '123 Riara Road', city: 'Nairobi', state: 'Nairobi County', postalCode: '00100', propertyType: 'Domestic', buildingType: 'Detached House', bedrooms: 4, bathrooms: 3, size: 300, sizeUnit: 'sqm', purchasePrice: 45000000, mortgage: 30000000, currentValue: 55000000, rentalValue: 250000, imageUrl: 'https://picsum.photos/seed/p1/600/400', imageHint: 'suburban house' },
  { id: 'p2', addressLine1: '456 Westlands Ave', city: 'Nairobi', state: 'Nairobi County', postalCode: '00800', propertyType: 'Domestic', buildingType: 'Flat', bedrooms: 2, bathrooms: 2, size: 120, sizeUnit: 'sqm', purchasePrice: 18000000, mortgage: 12000000, currentValue: 22000000, rentalValue: 150000, imageUrl: 'https://picsum.photos/seed/p2/600/400', imageHint: 'modern apartment' },
  { id: 'p3', addressLine1: '789 Ngong Road', city: 'Nairobi', state: 'Nairobi County', postalCode: '00505', propertyType: 'Domestic', buildingType: 'Detached House', bedrooms: 3, bathrooms: 2, size: 200, sizeUnit: 'sqm', purchasePrice: 25000000, mortgage: 18000000, currentValue: 30000000, rentalValue: 180000, imageUrl: 'https://picsum.photos/seed/p3/600/400', imageHint: 'cozy cottage' },
  { id: 'p4', addressLine1: '101 Muthaiga Rd', city: 'Nairobi', state: 'Nairobi County', postalCode: '00600', propertyType: 'Domestic', buildingType: 'Detached House', bedrooms: 5, bathrooms: 5, size: 500, sizeUnit: 'sqm', purchasePrice: 90000000, mortgage: 70000000, currentValue: 110000000, rentalValue: 600000, imageUrl: 'https://picsum.photos/seed/p4/600/400', imageHint: 'large house' },
  { id: 'p5', addressLine1: '212 Lavington Green', city: 'Nairobi', state: 'Nairobi County', postalCode: '00603', propertyType: 'Domestic', buildingType: 'Terraced House', bedrooms: 3, bathrooms: 4, size: 250, sizeUnit: 'sqm', purchasePrice: 35000000, mortgage: 25000000, currentValue: 42000000, rentalValue: 220000, imageUrl: 'https://picsum.photos/seed/p5/600/400', imageHint: 'townhouse property' },
  { id: 'p6', addressLine1: '333 Upper Hill', city: 'Nairobi', state: 'Nairobi County', postalCode: '00200', propertyType: 'Commercial', buildingType: 'Office', bedrooms: 0, bathrooms: 4, size: 400, sizeUnit: 'sqm', purchasePrice: 75000000, mortgage: 50000000, currentValue: 85000000, rentalValue: 500000, imageUrl: 'https://picsum.photos/seed/p6/600/400', imageHint: 'luxury condo' },
  { id: 'p7', addressLine1: '444 Karen Lane', city: 'Nairobi', state: 'Nairobi County', postalCode: '00502', propertyType: 'Domestic', buildingType: 'Detached House', bedrooms: 4, bathrooms: 4, size: 350, sizeUnit: 'sqm', purchasePrice: 65000000, mortgage: 45000000, currentValue: 75000000, rentalValue: 350000, imageUrl: 'https://picsum.photos/seed/p7/600/400', imageHint: 'family home' },
];

const t1_transactions: Transaction[] = [];
const t1_start = new Date('2025-06-01');
for (let i=0; i<12; i++) {
  const date = new Date(t1_start);
  date.setMonth(t1_start.getMonth() + i);
  t1_transactions.push({ id: `t1-${i+1}`, tenancyId: 't1', date: date.toISOString().split('T')[0], amount: 250000, propertyId: 'p1', propertyName: '123 Riara Road, Nairobi, Nairobi County 00100', type: 'revenue', tenant: 'John Doe', tenantEmail: 'john.doe@example.com', tenantPhone: '+254 712 345 678', deposit: i === 0 ? 250000: 0, amountPaid: i < 4 ? 250000 + (i === 0 ? 250000 : 0) : 0, tenancyStartDate: '2025-06-01', tenancyEndDate: '2026-05-31' });
}

const t2_transactions: Transaction[] = [];
const t2_start = new Date('2025-08-01');
for (let i=0; i<12; i++) {
  const date = new Date(t2_start);
  date.setMonth(t2_start.getMonth() + i);
  t2_transactions.push({ id: `t2-${i+1}`, tenancyId: 't2', date: date.toISOString().split('T')[0], amount: 150000, propertyId: 'p2', propertyName: '456 Westlands Ave, Nairobi, Nairobi County 00800', type: 'revenue', tenant: 'Jane Smith', tenantEmail: 'jane.smith@example.com', tenantPhone: '+254 723 456 789', deposit: i === 0 ? 150000: 0, amountPaid: i < 2 ? 150000 + (i === 0 ? 150000 : 0) : 0, tenancyStartDate: '2025-08-01', tenancyEndDate: '2026-07-31' });
}

const t3_transactions: Transaction[] = [];
const t3_start = new Date('2025-07-02');
for (let i=0; i<12; i++) {
  const date = new Date(t3_start);
  date.setMonth(t3_start.getMonth() + i);
  t3_transactions.push({ id: `t3-${i+1}`, tenancyId: 't3', date: date.toISOString().split('T')[0], amount: 180000, propertyId: 'p3', propertyName: '789 Ngong Road, Nairobi, Nairobi County 00505', type: 'revenue', tenant: 'Peter Jones', tenantEmail: 'peter.jones@example.com', tenantPhone: '+254 734 567 890', deposit: i === 0 ? 180000: 0, amountPaid: i < 3 ? 180000 + (i === 0 ? 180000 : 0) : 0, tenancyStartDate: '2025-07-02', tenancyEndDate: '2026-07-01' });
}

const t4_transactions: Transaction[] = [];
const t4_start = new Date('2025-10-01');
for (let i=0; i<12; i++) {
  const date = new Date(t4_start);
  date.setMonth(t4_start.getMonth() + i);
  t4_transactions.push({ id: `t4-${i+1}`, tenancyId: 't4', date: date.toISOString().split('T')[0], amount: 600000, propertyId: 'p4', propertyName: '101 Muthaiga Rd, Nairobi, Nairobi County 00600', type: 'revenue', tenant: 'Mike Johnson', tenantEmail: 'mike.johnson@example.com', tenantPhone: '+254 745 678 901', deposit: i === 0 ? 600000: 0, amountPaid: i < 1 ? 600000 + (i === 0 ? 600000: 0) : 0, tenancyStartDate: '2025-10-01', tenancyEndDate: '2026-09-30' });
}

const t5_transactions: Transaction[] = [];
const t5_start = new Date('2025-05-01');
for (let i=0; i<12; i++) {
  const date = new Date(t5_start);
  date.setMonth(t5_start.getMonth() + i);
  t5_transactions.push({ id: `t5-${i+1}`, tenancyId: 't5', date: date.toISOString().split('T')[0], amount: 500000, propertyId: 'p6', propertyName: '333 Upper Hill, Nairobi, Nairobi County 00200', type: 'revenue', tenant: 'Emily Williams', tenantEmail: 'emily.williams@example.com', tenantPhone: '+254 756 789 012', deposit: i === 0 ? 500000: 0, amountPaid: i < 5 ? 500000 + (i === 0 ? 500000 : 0) : (i === 5 ? 250000 : 0), tenancyStartDate: '2025-05-01', tenancyEndDate: '2026-04-30' });
}

export const revenue: Transaction[] = [
  ...t1_transactions,
  ...t2_transactions,
  ...t3_transactions,
  ...t4_transactions,
  ...t5_transactions
];

export const expenses: Transaction[] = [
  { id: 'e1', date: '2025-07-05', amount: 25000, propertyId: 'p1', propertyName: '123 Riara Road, Nairobi, Nairobi County 00100', type: 'expense', category: 'Maintenance', vendor: 'Nairobi Plumbing Services', expenseType: 'one-off' },
  { id: 'e2', date: '2025-08-10', amount: 50000, propertyId: 'p2', propertyName: '456 Westlands Ave, Nairobi, Nairobi County 00800', type: 'expense', category: 'Repairs', vendor: 'Westlands Roof Repairs', expenseType: 'one-off' },
  { id: 'e3', date: '2025-09-15', amount: 150000, type: 'expense', propertyName: 'General Expense', category: 'Insurance', vendor: 'Jubilee Insurance', expenseType: 'recurring', frequency: 'yearly', notes: 'Annual portfolio insurance premium.' },
  { id: 'e4', date: '2025-06-08', amount: 30000, propertyId: 'p1', propertyName: '123 Riara Road, Nairobi, Nairobi County 00100', type: 'expense', category: 'Repairs', vendor: 'General Repairs Co.', expenseType: 'one-off' },
  { id: 'e5', date: '2025-07-01', amount: 12500, propertyId: 'p1', propertyName: '123 Riara Road, Nairobi, Nairobi County 00100', type: 'expense', category: 'Management Fees', vendor: 'Property Management Ltd', expenseType: 'recurring', frequency: 'monthly' },
  { id: 'e6', date: '2025-08-01', amount: 12500, propertyId: 'p1', propertyName: '123 Riara Road, Nairobi, Nairobi County 00100', type: 'expense', category: 'Management Fees', vendor: 'Property Management Ltd', expenseType: 'recurring', frequency: 'monthly' },
  { id: 'e7', date: '2025-09-01', amount: 12500, propertyId: 'p1', propertyName: '123 Riara Road, Nairobi, Nairobi County 00100', type: 'expense', category: 'Management Fees', vendor: 'Property Management Ltd', expenseType: 'recurring', frequency: 'monthly' },
  { id: 'e8', date: '2025-09-20', amount: 75000, propertyId: 'p4', propertyName: '101 Muthaiga Rd, Nairobi, Nairobi County 00600', type: 'expense', category: 'Repairs', vendor: 'Gate Automation Inc.', expenseType: 'one-off' },
  { id: 'e9', date: '2025-10-01', amount: 12500, propertyId: 'p1', propertyName: '123 Riara Road, Nairobi, Nairobi County 00100', type: 'expense', category: 'Management Fees', vendor: 'Property Management Ltd', expenseType: 'recurring', frequency: 'monthly' },
];

export const changelog: ChangeLogEntry[] = [
    { id: 'cl1', date: '2025-10-01T10:00:00Z', type: 'Property', action: 'Created', description: 'Property "123 Riara Road" was added.', entityId: 'p1' },
    { id: 'cl2', date: '2025-10-02T11:30:00Z', type: 'Tenancy', action: 'Created', description: 'Tenancy for "John Doe" at "123 Riara Road" was created.', entityId: 't1' },
    { id: 'cl3', date: '2025-10-03T14:00:00Z', type: 'Expense', action: 'Created', description: 'Expense of KES 25,000 for "Maintenance" was logged.', entityId: 'e1' },
    { id: 'cl4', date: '2025-10-04T09:00:00Z', type: 'Payment', action: 'Created', description: 'Payment of KES 500,000 received from "John Doe".', entityId: 't1-1' },
    { id: 'cl5', date: '2025-10-05T16:20:00Z', type: 'Property', action: 'Updated', description: 'Current value for "456 Westlands Ave" updated to KES 22,000,000.', entityId: 'p2' },
];


// This is now derived from the revenue data, but we keep the type for structure.
export const arrears: Arrear[] = [];

export const weatherData = {
  city: 'Springfield',
  temperature: '25°C',
  condition: 'Sunny',
  forecast: [
    { day: 'Tomorrow', condition: 'Partly cloudy', temp: '23°C' },
    { day: 'In 2 days', condition: 'Rain showers', temp: '20°C', precipitation_chance: '70%' },
    { day: 'In 3 days', condition: 'Thunderstorms', temp: '19°C', precipitation_chance: '90%' },
  ]
};

const allArrears = revenue
  .filter(r => (r.amountPaid ?? 0) < r.amount && new Date(r.date) < new Date())
  .reduce((acc, r) => acc + (r.amount - (r.amountPaid ?? 0)), 0);


export const dashboardData = {
    totalPropertyValue: properties.reduce((acc, p) => acc + p.currentValue, 0),
    totalRevenue: revenue.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).reduce((acc, r) => acc + (r.amountPaid ?? 0), 0),
    totalExpenses: expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).reduce((acc, e) => acc + e.amount, 0),
    totalArrears: allArrears,
    get totalProfit() {
      return this.totalRevenue - this.totalExpenses;
    },
};
