
import { notFound } from 'next/navigation';
import { PropertyDetailClient } from './property-detail-client';
import { getProperty } from '@/lib/data/properties';
import { getTenancies } from '@/lib/data/tenancies';
import { getUserSettings } from '@/lib/data/settings';

// Helper to determine occupancy
function isPropertyOccupied(tenancies: any[] = []) {
  const now = new Date();
  return tenancies.some(t => {
    const endDate = new Date(t.endDate);
    return endDate >= now && t.status === 'Active';
  });
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ propertyId: string }> }) {
  // Await params first to satisfy Next.js 15+ requirements
  const { propertyId } = await params;

  const [property, tenancies, settings] = await Promise.all([
    getProperty(propertyId),
    getTenancies(propertyId),
    getUserSettings(),
  ]);

  if (!property) {
    notFound();
  }

  const isOccupied = isPropertyOccupied(tenancies);

  return (
    <PropertyDetailClient
      property={property}
      isOccupied={isOccupied}
      settings={settings}
    />
  );
}
