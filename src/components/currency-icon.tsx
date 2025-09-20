
'use client';

import type { LucideProps } from 'lucide-react';
import { DollarSign, Euro, PoundSterling, SwissFranc } from 'lucide-react';
import { useDataContext } from '@/context/data-context';

export function CurrencyIcon(props: LucideProps) {
  const { currency } = useDataContext();

  switch (currency) {
    case 'USD':
    case 'AUD':
    case 'CAD':
      return <DollarSign {...props} />;
    case 'EUR':
      return <Euro {...props} />;
    case 'GBP':
      return <PoundSterling {...props} />;
    case 'CHF':
      return <SwissFranc {...props} />;
    case 'JPY':
    case 'CNY':
    case 'KES': // Kenyan Shilling doesn't have a specific icon, fallback to text or a generic one
    default:
      // Fallback for currencies without a specific icon
      return (
        <span className="text-muted-foreground font-semibold" style={{ fontSize: props.height ? Number(props.height) * 0.9 : 'inherit' }}>
          {new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).formatToParts(0).find(p => p.type === 'currency')?.value}
        </span>
      );
  }
}
