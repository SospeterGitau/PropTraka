
'use client';

import { Home, Building, Building2, HardHat, LandPlot, type LucideProps } from 'lucide-react';
import type { Property } from '@/lib/types';

interface PropertyIconProps extends LucideProps {
    type: Property['buildingType'];
}

export function PropertyIcon({ type, ...props }: PropertyIconProps) {
  switch (type) {
    case 'House':
      return <Home {...props} />;
    case 'Apartment':
      return <Building {...props} />;
    case 'Condo':
      return <Building2 {...props} />;
    case 'Townhouse':
      return <Home {...props} />;
    case 'Bungalow':
      return <Home {...props} />;
    case 'Villa':
        return <Home {...props} />;
    case 'Other':
    default:
      return <HardHat {...props} />;
  }
}
