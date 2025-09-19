import type { Property, Transaction, Arrear, CalendarEvent } from './types';

export const properties: Property[] = [
  { id: 'p1', address: '123 Maple St, Springfield', purchasePrice: 250000, mortgage: 200000, currentValue: 300000, rentalValue: 1800, imageUrl: 'https://picsum.photos/seed/p1/600/400', imageHint: 'suburban house' },
  { id: 'p2', address: '456 Oak Ave, Shelbyville', purchasePrice: 320000, mortgage: 250000, currentValue: 350000, rentalValue: 2200, imageUrl: 'https://picsum.photos/seed/p2/600/400', imageHint: 'modern apartment' },
  { id: 'p3', address: '789 Pine Ln, Capital City', purchasePrice: 180000, mortgage: 150000, currentValue: 210000, rentalValue: 1400, imageUrl: 'https://picsum.photos/seed/p3/600/400', imageHint: 'cozy cottage' },
  { id: 'p4', address: '101 Elm Ct, Ogdenville', purchasePrice: 450000, mortgage: 400000, currentValue: 500000, rentalValue: 3000, imageUrl: 'https://picsum.photos/seed/p4/600/400', imageHint: 'large house' },
  { id: 'p5', address: '212 Birch Rd, North Haverbrook', purchasePrice: 210000, mortgage: 180000, currentValue: 240000, rentalValue: 1650, imageUrl: 'https://picsum.photos/seed/p5/600/400', imageHint: 'townhouse property' },
  { id: 'p6', address: '333 Cedar Blvd, Brockway', purchasePrice: 600000, mortgage: 500000, currentValue: 650000, rentalValue: 4000, imageUrl: 'https://picsum.photos/seed/p6/600/400', imageHint: 'luxury condo' },
  { id: 'p7', address: '444 Spruce Way, Cypress Creek', purchasePrice: 280000, mortgage: 220000, currentValue: 310000, rentalValue: 2000, imageUrl: 'https://picsum.photos/seed/p7/600/400', imageHint: 'family home' },
];

export const revenue: Transaction[] = [
  { id: 'r1', date: '2024-07-01', amount: 1800, propertyId: 'p1', propertyName: '123 Maple St', type: 'revenue', tenant: 'John Doe' },
  { id: 'r2', date: '2024-07-01', amount: 2200, propertyId: 'p2', propertyName: '456 Oak Ave', type: 'revenue', tenant: 'Jane Smith' },
  { id: 'r3', date: '2024-07-02', amount: 1400, propertyId: 'p3', propertyName: '789 Pine Ln', type: 'revenue', tenant: 'Peter Jones' },
  { id: 'r4', date: '2024-06-01', amount: 1800, propertyId: 'p1', propertyName: '123 Maple St', type: 'revenue', tenant: 'John Doe' },
  { id: 'r5', date: '2024-06-01', amount: 2200, propertyId: 'p2', propertyName: '456 Oak Ave', type: 'revenue', tenant: 'Jane Smith' },
];

export const expenses: Transaction[] = [
  { id: 'e1', date: '2024-07-05', amount: 150, propertyId: 'p1', propertyName: '123 Maple St', type: 'expense', category: 'Maintenance', vendor: 'Springfield Plumbing' },
  { id: 'e2', date: '2024-07-10', amount: 300, propertyId: 'p2', propertyName: '456 Oak Ave', type: 'expense', category: 'Repairs', vendor: 'Shelbyville Roofers' },
  { id: 'e3', date: '2024-07-15', amount: 80, propertyId: 'p3', propertyName: '789 Pine Ln', type: 'expense', category: 'Insurance', vendor: 'Capital City Insurance' },
  { id: 'e4', date: '2024-06-08', amount: 200, propertyId: 'p1', propertyName: '123 Maple St', type: 'expense', category: 'Repairs', vendor: 'General Repairs Co.'},
];

export const arrears: Arrear[] = [
  { tenant: 'Mike Johnson', propertyAddress: '101 Elm Ct', amount: 3000, dueDate: '2024-07-01' },
  { tenant: 'Emily Williams', propertyAddress: '333 Cedar Blvd', amount: 500, dueDate: '2024-07-05' },
];

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth();

export const calendarEvents: CalendarEvent[] = [
  { date: new Date(currentYear, currentMonth, 2).toISOString().split('T')[0], title: 'Gas safety check - 123 Maple St', type: 'appointment' },
  { date: new Date(currentYear, currentMonth, 15).toISOString().split('T')[0], title: 'New tenancy starts - 789 Pine Ln', type: 'tenancy-start' },
  { date: new Date(currentYear, currentMonth, 10).toISOString().split('T')[0], title: 'Viewing - 456 Oak Ave', type: 'appointment' },
  { date: new Date(currentYear, currentMonth, 28).toISOString().split('T')[0], title: 'Tenancy ends - 101 Elm Ct', type: 'tenancy-end' },
  { date: new Date(currentYear, currentMonth + 1, 1).toISOString().split('T')[0], title: 'Tenancy starts - 101 Elm Ct', type: 'tenancy-start' },
];

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

export const dashboardData = {
    totalPropertyValue: properties.reduce((acc, p) => acc + p.currentValue, 0),
    totalRevenue: revenue.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).reduce((acc, r) => acc + r.amount, 0),
    totalExpenses: expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).reduce((acc, e) => acc + e.amount, 0),
    totalArrears: arrears.reduce((acc, a) => acc + a.amount, 0),
    get totalProfit() {
      return this.totalRevenue - this.totalExpenses;
    },
};
