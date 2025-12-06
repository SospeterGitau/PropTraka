
'use client';

import { useDataContext } from '@/context/data-context';
import { useUser } from '@/firebase';
import { Building, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardPageContent from '@/app/(dashboard)/dashboard/page';

export default function DashboardPage() {
  const { user, isAuthLoading: authLoading } = useUser();
  const { properties, isLoading: dataLoading } = useDataContext();

  const isLoading = authLoading || dataLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If loading is finished and there are no properties, show the "empty state" card.
  if (!isLoading && properties.length === 0) {
    return (
      <>
        <PageHeader 
          title="Welcome to PropTraka"
        >
           <div className="hidden sm:block" />
        </PageHeader>
        <Card className="text-center py-16">
          <CardHeader>
              <div className="mx-auto bg-muted rounded-full p-4 w-fit">
                  <Building className="w-12 h-12 text-muted-foreground" />
              </div>
              <CardTitle className="mt-4 !text-2xl">Your Dashboard is Ready</CardTitle>
              <CardDescription>Start by adding your first property to see your financial overview here.</CardDescription>
          </CardHeader>
          <CardContent>
              <Button asChild size="lg">
                  <Link href="/properties">Add Your First Property</Link>
              </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  // If properties exist, show the full dashboard content.
  return <DashboardPageContent />;
}

