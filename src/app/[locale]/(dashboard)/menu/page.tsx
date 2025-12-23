
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  LineChart,
  CircleAlert,
  Calendar,
  Users,
  Activity,
  Landmark,
  LifeBuoy, // Changed from HelpCircle to LifeBuoy for Help Center
  Receipt,
  Briefcase,
} from 'lucide-react';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'More',
  description: 'Find more pages and app features.',
};

const mainNavItems = [
  { href: '/reports', label: 'Reports', icon: LineChart },
  { href: '/arrears', label: 'Arrears', icon: CircleAlert },
  { href: '/tenants', label: 'Tenants', icon: Users },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/contractors', label: 'Contractors', icon: Briefcase },
  { href: '/activity', label: 'Activity', icon: Activity },
];

const secondaryNavItems = [
  { href: '/lease-tools', label: 'Lease Tools', icon: Landmark },
  { href: '/help-center', label: 'Help Center', icon: LifeBuoy }, // New Help Center link
];


export default function MorePage() {
  return (
    <>
      <PageHeader title="More" />
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mainNavItems.map((item) => (
              <Link href={item.href} key={item.href} passHref>
                <Card className="hover:bg-muted transition-colors h-full">
                  <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
                    <item.icon className="w-8 h-8 text-primary" />
                    <span className="text-sm font-medium text-center">{item.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Help & Info</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {secondaryNavItems.map((item) => (
              <Link href={item.href} key={item.href} passHref>
                <Card className="hover:bg-muted transition-colors h-full">
                  <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
                    <item.icon className="w-8 h-8 text-primary" />
                    <span className="text-sm font-medium text-center">{item.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your profile, settings, and subscription.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/settings">Go to Account Settings</Link>
            </Button>
          </CardContent>
        </Card>

      </div>
    </>
  );
}
