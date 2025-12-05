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
  const { properties, isLoading: dataLoading } = useDataContext();

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

  // Empty State - show if no properties are added yet
  if (properties.length === 0) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description={`Welcome back, ${user?.displayName || user?.email || 'User'}!`}
        />
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Get Started with Your Portfolio</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-sm">
              Add your first property to begin tracking your real estate portfolio and manage your properties efficiently
            </p>
            <Button asChild>
              <Link href="/properties">Add Your First Property</Link>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  return <DashboardPageContent />;
}
