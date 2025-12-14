
'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface HelpCenterLayoutProps {
  children: React.ReactNode;
}

export default function HelpCenterLayout({ children }: HelpCenterLayoutProps) {
  const pathname = usePathname();

  // No need for isHelpCenterRoot check here, as the individual pages will handle their back buttons
  return (
    <div className="space-y-8 py-8">
      <div>
        {children}
      </div>
    </div>
  );
}
