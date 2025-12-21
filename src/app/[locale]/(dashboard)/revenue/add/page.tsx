import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Building, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { TenancyForm } from '@/components/tenancy-form';
import { getProperties } from '@/lib/data/properties';

export default async function AddTenancyPage() {
  const properties = await getProperties();

  if (properties.length === 0) {
    return (
      <>
        <PageHeader title="Add New Tenancy" />
        <Card className="text-center py-16">
          <CardHeader>
            <div className="mx-auto bg-muted rounded-full p-4 w-fit">
              <Building className="w-12 h-12 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4 !text-2xl">No Properties Found</CardTitle>
            <CardDescription>You need to add a property before you can create a tenancy.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/properties">Add Your First Property</Link>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Add New Tenancy">
        <Button variant="outline" asChild>
          <Link href="/revenue">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Revenue
          </Link>
        </Button>
      </PageHeader>
      <TenancyForm properties={properties} />
    </>
  );
}
