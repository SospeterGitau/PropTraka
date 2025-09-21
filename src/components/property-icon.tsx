
'use client';

import { Home, Building, Building2, HardHat, Factory, Store, type LucideProps } from 'lucide-react';
import type { Property } from '@/lib/types';

interface PropertyIconProps extends LucideProps {
    type: Property['buildingType'];
}

export function PropertyIcon({ type, ...props }: PropertyIconProps) {
  switch (type) {
    case 'Terraced House':
    case 'Semi-Detached House':
    case 'Detached House':
    case 'Bungalow':
    case 'Maisonette':
      return <Home {...props} />;
    case 'Flat':
      return <Building {...props} />;
    case 'Office':
      return <Building2 {...props} />;
    case 'Retail':
        return <Store {...props} />;
    case 'Industrial':
        return <Factory {...props} />;
    case 'Other':
    default:
      return <HardHat {...props} />;
  }
}
