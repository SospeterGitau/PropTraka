'use client';

import { useEffect, useState } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useDataContext } from '@/context/data-context';
import type { User } from 'firebase/auth';
import { Building, Users, TrendingUp, TrendingDown, Loader2, AlertCircle, DollarSign } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useFirebase } from '@/firebase';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { properties, isLoading: dataLoading } = useDataContext();
  const { firestore } = useFirebase();

  // Additional stats
  const [tenanciesCount, setTenanciesCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [arrearsCount, setArrearsCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (!currentUser) {
        router.push('/signin');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Load additional stats
  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;

      try {
        setStatsLoading(true);

        // Load tenancies
        const tenanciesQuery = query(
          collection(firestore, 'tenancies'),
          where('ownerId', '==', user.uid)
        );
        const tenanciesSnap = await getDocs(tenanciesQuery);
        setTenanciesCount(tenanciesSnap.size);

        // Load revenue
        const revenueQuery = query(
          collection(firestore, 'revenue'),
          where('ownerId', '==', user.uid)
        );
        const revenueSnap = await getDocs(revenueQuery);
        const revenueTotal = revenueSnap.docs.reduce((sum, doc) => {
          const data = doc.data();
          return sum + (data.amount || 0);
        }, 0);
        setTotalRevenue(revenueTotal);

        // Load expenses
        const expensesQuery = query(
          collection(firestore, 'expenses'),
          where('ownerId', '==', user.uid)
        );
        const expensesSnap = await getDocs(expensesQuery);
        const expensesTotal = expensesSnap.docs.reduce((sum, doc) => {
          const data = doc.data();
          return sum + (data.amount || 0);
        }, 0);
        setTotalExpenses(expensesTotal);

        // Calculate arrears (simplified)
        setArrearsCount(0); // TODO: Calculate actual arrears

      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    if (!loading && user) {
      loadStats();
    }
  }, [user, firestore, loading]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const totalProperties = properties.length;
  const totalAssetValue = properties.reduce((sum, prop) => sum + (prop.purchasePrice || 0), 0);
  const netIncome = totalRevenue - totalExpenses;

  return (
    <>
      {/* Header with logout */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.displayName || user?.email || 'User'}!
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-secondary text-foreground hover:bg-secondary/80 h-10 px-4"
        >
          Logout
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Properties */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Properties</h3>
            <Building className="h-5 w-5 text-muted-foreground" />
          </div>
          {dataLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <>
              <p className="text-3xl font-bold text-foreground">{totalProperties}</p>
              <p className="text-sm text-muted-foreground">Total properties</p>
            </>
          )}
        </div>

        {/* Tenants */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Tenants</h3>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          {statsLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <>
              <p className="text-3xl font-bold text-foreground">{tenanciesCount}</p>
              <p className="text-sm text-muted-foreground">Active tenancies</p>
            </>
          )}
        </div>

        {/* Revenue */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Revenue</h3>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          {statsLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <>
              <p className="text-3xl font-bold text-foreground">KES {totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total revenue</p>
            </>
          )}
        </div>

        {/* Expenses */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Expenses</h3>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </div>
          {statsLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <>
              <p className="text-3xl font-bold text-foreground">KES {totalExpenses.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total expenses</p>
            </>
          )}
        </div>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Asset Value */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Asset Value</h3>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </div>
          {dataLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <>
              <p className="text-2xl font-bold text-foreground">KES {totalAssetValue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total property value</p>
            </>
          )}
        </div>

        {/* Net Income */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Net Income</h3>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          {statsLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <>
              <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                KES {netIncome.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Revenue - Expenses</p>
            </>
          )}
        </div>

        {/* Arrears */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Arrears</h3>
            <AlertCircle className="h-5 w-5 text-orange-500" />
          </div>
          {statsLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : (
            <>
              <p className="text-2xl font-bold text-foreground">{arrearsCount}</p>
              <p className="text-sm text-muted-foreground">Overdue payments</p>
            </>
          )}
        </div>
      </div>

      {/* Empty State */}
      {totalProperties === 0 && !dataLoading && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No properties yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first property
          </p>
          <a
            href="/properties/add"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"
          >
            Add Property
          </a>
        </div>
      )}
    </>
  );
}
