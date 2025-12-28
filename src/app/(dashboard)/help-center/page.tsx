
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Menu, Lightbulb, ShieldCheck, HelpCircle, LayoutDashboard, Home, Wallet, Wrench, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { useUser } from '@/firebase/auth';
import { firestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

// Define help categories relevant to PropTraka
const helpCategories = [
  {
    title: 'Getting Started',
    description: 'Learn how to set up your account and add your first property.',
    icon: Home,
    link: '/help-center/faq#getting-started'
  },
  {
    title: 'Managing Properties',
    description: 'Guidelines on adding, editing, and managing your properties.',
    icon: LayoutDashboard,
    link: '/help-center/faq#core-features'
  },
  {
    title: 'Financials & Payments',
    description: 'Understand rent tracking, expenses, and payment requests.',
    icon: Wallet,
    link: '/help-center/faq#core-features'
  },
  {
    title: 'Maintenance & Contractors',
    description: 'Information on managing maintenance requests and contractors.',
    icon: Wrench,
    link: '/help-center/faq#advanced-tools-ai'
  },
  {
    title: 'Security & Privacy',
    description: 'How we protect your data and your privacy policy.',
    icon: ShieldCheck,
    link: '/help-center/privacy-policy'
  },
  {
    title: 'Reports & Analytics',
    description: 'Generate and understand property performance reports.',
    icon: FileText,
    link: '/help-center/faq#advanced-tools-ai'
  },
  {
    title: 'FAQs',
    description: 'Common questions and quick solutions.',
    icon: HelpCircle,
    link: '/help-center/faq'
  },
  {
    title: 'Tips & Best Practices',
    description: 'Expand your knowledge and optimize your property management.',
    icon: Lightbulb,
    link: '/help-center/tips'
  },
];

export default function HelpCenterLandingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Log search query to Firestore for R&D
    try {
      await addDoc(collection(firestore, 'help_search_queries'), {
        query: searchQuery,
        userId: user?.uid || 'anonymous',
        timestamp: serverTimestamp(),
        path: '/help-center'
      });
    } catch (error) {
      console.error("Error logging search query:", error);
    }

    // For now, just redirect to FAQ with search param (implementation detail for future search results page)
    // Or just alert for this MVP step if no search page exists yet.
    // Since we don't have a search results page, we'll route to FAQ.
    router.push(`/help-center/faq?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header for Help Center Landing */}
      <div className="flex justify-between items-center mb-8 border-b pb-4 pt-2">
        <h1 className="text-3xl font-bold">Help Center</h1>
        <Button variant="outline" onClick={() => router.push('/menu')} size="icon" className="h-10 w-10">
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary/10 to-transparent rounded-lg p-10 mb-12 overflow-hidden">
        <div className="max-w-3xl z-10 relative">
          <p className="text-xl text-muted-foreground mb-6">Find solutions fast.</p>
          <form onSubmit={handleSearch} className="flex w-full max-w-md items-center space-x-2">
            <Input
              type="text"
              placeholder="Search articles..."
              className="flex-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          <div className="mt-4 flex gap-2 text-sm text-muted-foreground">
            Popular:
            <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground">properties</Button>
            <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground">payments</Button>
            <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground">maintenance</Button>
          </div>
        </div>
        {/* Abstract background element */}
        <div className="absolute inset-y-0 right-0 w-1/2 bg-cover bg-center opacity-30" style={{ backgroundImage: 'url(/logo.png)' }}></div>
      </div>

      {/* Categorized Help Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Explore Help Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {helpCategories.map((category) => (
            <Link href={category.link} key={category.title}>
              <Card className="hover:border-primary transition-colors h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <category.icon className="h-6 w-6 text-primary" />
                    <CardTitle>{category.title}</CardTitle>
                  </div>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Essential Navigation Links */}
      <div className="mt-12 pt-8 border-t flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
        <Link href="/help-center/faq" className="hover:text-primary transition-colors">FAQs</Link>
        <Link href="/help-center/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
        <Link href="/help-center/terms-and-conditions" className="hover:text-primary transition-colors">Terms & Conditions</Link>
        <Link href="/help-center/accessibility" className="hover:text-primary transition-colors">Accessibility</Link>
        <Link href="/help-center/contact" className="hover:text-primary transition-colors">Contact Us</Link>
      </div>
    </div>
  );
}
