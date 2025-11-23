
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import {
  Building,
  Calendar,
  CircleAlert,
  HelpCircle,
  LayoutDashboard,
  LineChart,
  LogOut,
  Shield,
  TrendingUp,
  TrendingDown,
  Users,
  Wrench,
  User,
  Sparkles,
  Landmark,
  Mail,
  FileText,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Menu',
    description: 'Navigate through all the features of PropTraka.',
};

const manageNavItems = [
  { href: '/properties', label: 'Properties', icon: Building },
  { href: '/revenue', label: 'Revenue', icon: TrendingUp },
  { href: '/expenses', label: 'Expenses', icon: TrendingDown },
  { href: '/arrears', label: 'Arrears', icon: CircleAlert },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench },
  { href: '/contractors', label: 'Contractors', icon: Users },
];

const analysisNavItems = [
  { href: '/reports', label: 'Reports', icon: LineChart },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/lease-tools', label: 'Lease Tools', icon: Landmark },
];

const helpNavItems = [
    { href: '/faq', label: 'FAQ', icon: HelpCircle },
    { href: '/contact', label: 'Contact Us', icon: Mail },
    { href: '/privacy', label: 'Privacy Policy', icon: Shield },
];


export default function MenuPage() {
  return (
    <>
      <PageHeader title="Menu" />
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Manage</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {manageNavItems.map((item) => (
              <Link href={item.href} key={item.href}>
                <Card className="hover:bg-muted transition-colors">
                  <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
                    <item.icon className="w-8 h-8 text-primary" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Analyze</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {analysisNavItems.map((item) => (
              <Link href={item.href} key={item.href}>
                <Card className="hover:bg-muted transition-colors">
                  <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
                    <item.icon className="w-8 h-8 text-primary" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
        
         <div>
          <h2 className="text-xl font-semibold mb-4">Help & Info</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {helpNavItems.map((item) => (
              <Link href={item.href} key={item.href}>
                <Card className="hover:bg-muted transition-colors">
                  <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
                    <item.icon className="w-8 h-8 text-primary" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
