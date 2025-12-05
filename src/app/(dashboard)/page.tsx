'use client';

import { useDataContext } from '@/context/data-context';
import { useUser } from '@/firebase';
import { Building, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DashboardPageContent from '@/app/(dashboard)/dashboard/page';

export default function DashboardPage() {
  const { user, isAuthLoading: authLoading } = useUser();
  const { isLoading: dataLoading } = useDataContext();

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // The main dashboard content is now always rendered.
  // The logic inside DashboardPageContent handles the calculations correctly
  // whether data exists or not.
  return <DashboardPageContent />;
}
