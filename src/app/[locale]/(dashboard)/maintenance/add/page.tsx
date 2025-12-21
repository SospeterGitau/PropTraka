import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getProperties } from '@/lib/data/properties';
import { getContractors } from '@/lib/data/maintenance';
import { MaintenanceFormWrapper } from '@/components/maintenance-form-wrapper';

export default async function AddMaintenancePage() {
  const [properties, contractors] = await Promise.all([
    getProperties(),
    getContractors(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Add Maintenance Request">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/maintenance">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>
            Enter the details of the maintenance issue below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MaintenanceFormWrapper properties={properties} contractors={contractors} />
        </CardContent>
      </Card>
    </div>
  );
}
