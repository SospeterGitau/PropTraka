import {
  getProperties
} from '@/lib/data/properties';
import {
  getRevenue,
  getExpenses
} from '@/lib/data/finance';
import {
  getTenancies
} from '@/lib/data/tenancies';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export default async function DashboardPage() {
  // Parallel Data Fetching
  const [properties, revenue, expenses, tenancies] = await Promise.all([
    getProperties(),
    getRevenue(),
    getExpenses(),
    getTenancies()
  ]);

  // Metrics Calculation (Server-Side)
  // Financial KPIs
  const totalRevenue = revenue
    .filter(tx => tx.status === 'Paid')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const profit = totalRevenue - totalExpenses;

  const overdueTransactions = revenue.filter(tx => tx.status === 'Overdue');
  const totalArrears = overdueTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const arrearsCount = overdueTransactions.length;

  // Property KPIs
  const totalPropertyValue = properties.reduce((sum, p) => sum + (p.currentValue || 0), 0);
  const totalMortgageBalance = properties.reduce((sum, p) => sum + (p.mortgageBalance || 0), 0);
  const portfolioNetWorth = totalPropertyValue - totalMortgageBalance;

  // Occupancy & Rent KPIs
  const occupiedProperties = new Set(tenancies.filter(t => t.status === 'Active').map(t => t.propertyId));
  const occupancyRate = properties.length > 0 ? (occupiedProperties.size / properties.length) * 100 : 0;

  const activeTenancies = tenancies.filter(t => t.status === 'Active');
  // Assuming 'rentAmount' exists on Tenancy or fetching it from property? 
  // Checking types.ts: Tenancy has rentAmount?
  // Let's assume it does or we use property targetRent?
  // Previous code used `t.rentAmount`.
  const totalRentOfActiveTenancies = activeTenancies.reduce((sum, t) => sum + (t.rentAmount || 0), 0);
  const avgRentPerTenancy = activeTenancies.length > 0 ? totalRentOfActiveTenancies / activeTenancies.length : 0;

  // Current Month Revenue
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const thisMonthRevenue = revenue
    .filter(r => {
      const date = new Date(r.date); // r.date is ISO string
      return r.status === 'Paid' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, r) => sum + r.amount, 0);

  const metrics = {
    totalRevenue,
    totalExpenses,
    profit,
    totalArrears,
    totalPropertyValue,
    portfolioNetWorth,
    occupancyRate,
    avgRentPerTenancy,
    totalProperties: properties.length,
    activeTenanciesCount: activeTenancies.length,
    thisMonthRevenue,
    arrearsCount,
  };

  return <DashboardClient metrics={metrics} properties={properties} />;
}
