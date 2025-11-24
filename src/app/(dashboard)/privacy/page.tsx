
'use client';

import { PageHeader } from '@/components/page-header';
import { ShieldCheck, Database, BarChart, Server, Lock, UserCog, Handshake, Trash2, Repeat, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useState, useEffect, useRef } from 'react';

type Section = {
  id: string;
  title: string;
  icon: React.ElementType;
  summary: string;
  content: React.ReactNode;
};

const lastUpdated = new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const sections: Section[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    icon: ShieldCheck,
    summary: 'You are the Data Controller; we are the Data Processor.',
    content: (
      <>
        <p>This Privacy Policy explains our roles under data protection laws like the Kenya Data Protection Act, 2019 (DPA). You, the user, own and control the personal data of your tenants. PropTraka processes this data on your behalf to provide our services.</p>
      </>
    ),
  },
  {
    id: 'data-we-process',
    title: 'Data We Process',
    icon: Database,
    summary: 'We process tenant and financial data you provide.',
    content: (
      <>
        <p>PropTraka processes the following categories of personal data about your tenants ("Data Subjects"), which you provide:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><b>Identity and Contact Data:</b> Tenant's full name, email address, and phone number.</li>
          <li><b>Tenancy and Financial Data:</b> Information linking a tenant to a property, including lease details, rent amounts, service charges, deposits, and payment records.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'analytics-data',
    title: 'Service Improvement Data',
    icon: BarChart,
    summary: 'We collect anonymous usage data to improve the app.',
    content: (
      <>
        <p>To maintain and improve our service, PropTraka also collects anonymous usage data through Google Analytics for Firebase. This includes information such as which pages are visited (e.g., `/dashboard`, `/properties`), features used, and general interaction patterns. This data is aggregated, contains no personal information, and is used solely to identify bugs and enhance user experience.</p>
      </>
    ),
  },
  {
    id: 'processing-purpose',
    title: 'Purpose of Processing',
    icon: Server,
    summary: 'We use your data to power the app\'s features.',
    content: (
      <>
        <p>As a Data Processor, PropTraka uses the personal data you provide exclusively to:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Associate revenue and expense transactions with specific tenancies and properties.</li>
          <li>Track rental payments and manage arrears.</li>
          <li>Enable you to send reminders and communications to tenants.</li>
          <li>Facilitate payment requests through integrated payment gateways.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'lawful-basis',
    title: 'Lawful Basis for Processing',
    icon: Handshake,
    summary: 'You are responsible for having a lawful basis to process tenant data.',
    content: (
      <>
        <p>As the Data Controller, you must ensure you have a lawful basis under the DPA. The two primary bases are:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><b>Performance of a Contract:</b> Processing is necessary to manage the tenancy agreement between you and your tenant.</li>
            <li><b>Consent:</b> You have obtained clear, explicit consent from the tenant. The "Add Tenancy" form includes a mandatory consent checkbox to help you document this.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'data-security',
    title: 'Data Storage & Security',
    icon: Lock,
    summary: 'Your data is encrypted and protected by strict access controls.',
    content: (
      <>
        <p>All data is stored securely in Google Cloud Firestore. We implement the following measures:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><b>Access Control:</b> Firestore Security Rules ensure only you, the authenticated owner, can access your data.</li>
            <li><b>Encryption:</b> All data is automatically encrypted both in transit and at rest.</li>
        </ul>
        <p className="mt-2">You are responsible for securing your account credentials.</p>
      </>
    ),
  },
  {
    id: 'data-retention',
    title: 'Data Retention',
    icon: Trash2,
    summary: 'You control how long data is stored.',
    content: (
      <>
        <p>PropTraka retains tenant data as long as their tenancy records exist in your account. As the Data Controller, you are responsible for removing personal data when it is no longer necessary. You can permanently delete a tenancy and all associated information at any time from the app.</p>
      </>
    ),
  },
  {
    id: 'data-subject-rights',
    title: 'Data Subject Rights',
    icon: UserCog,
    summary: 'We provide you the tools to fulfill tenant data requests.',
    content: (
      <>
        <p>Under the DPA, tenants have rights over their personal data. You are responsible for handling their requests. PropTraka enables you to fulfill these rights:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><b>Right to Access:</b> Access all tenant data via the Revenue, Arrears, and specific Tenancy Detail pages.</li>
          <li><b>Right to Rectification:</b> Edit tenancy details to correct any inaccurate information.</li>
          <li><b>Right to Erasure:</b> Delete a tenancy record to permanently erase the tenant's personal data.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'policy-changes',
    title: 'Changes to this Policy',
    icon: Repeat,
    summary: 'We may update this policy and will notify you of changes.',
    content: (
      <>
        <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>
      </>
    ),
  },
  {
    id: 'disclaimer',
    title: 'Disclaimer',
    icon: Info,
    summary: 'This policy is not legal advice.',
    content: (
      <>
        <p>This Privacy Policy is for informational purposes only and does not constitute legal advice. You should consult with a legal professional to ensure your full compliance with all applicable data protection laws, including the Kenya Data Protection Act, 2019.</p>
      </>
    ),
  },
];


export default function PrivacyPolicyPage() {
    const [activeSection, setActiveSection] = useState('introduction');
    const observer = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        observer.current = new IntersectionObserver((entries) => {
            const visibleSection = entries.find((entry) => entry.isIntersecting)?.target;
            if (visibleSection) {
                setActiveSection(visibleSection.id);
            }
        }, { rootMargin: '-20% 0px -80% 0px' });

        const elements = sections.map(section => document.getElementById(section.id)).filter(el => el);
        elements.forEach(el => observer.current?.observe(el!));

        return () => {
            elements.forEach(el => observer.current?.unobserve(el!));
        };
    }, []);

  return (
    <>
      <PageHeader title="Privacy Policy" />
      <div className="flex flex-col md:flex-row gap-12">
        {/* Sticky Sidebar */}
        <aside className="md:w-1/4 lg:w-1/5 md:sticky top-24 self-start">
            <nav>
                <ul className="space-y-3">
                    {sections.map(section => (
                         <li key={section.id}>
                            <a 
                                href={`#${section.id}`}
                                className={cn(
                                    "flex items-center gap-3 text-sm font-medium transition-colors",
                                    activeSection === section.id 
                                        ? 'text-primary' 
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <section.icon className="h-5 w-5" />
                                <span>{section.title}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-12">
            <div className="text-center pb-8 border-b">
                 <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-4" />
                 <h1 className="text-3xl font-bold">PropTraka Privacy Policy</h1>
                 <p className="text-muted-foreground mt-2">Last updated on {lastUpdated}</p>
                 <p className="mt-4 max-w-2xl mx-auto">We value your trust. This policy explains what data we process, why we need it, and how we keep it secure. As a user of PropTraka, you are in control of your data.</p>
            </div>
            {sections.map(section => (
                <section key={section.id} id={section.id} className="scroll-mt-24 space-y-4">
                    <h2 className="text-2xl font-bold">{section.title}</h2>
                    <p className="text-lg text-muted-foreground font-semibold">{section.summary}</p>
                    <div className="text-base text-foreground/80 space-y-4">
                        {section.content}
                    </div>
                </section>
            ))}
        </main>
      </div>
    </>
  );
}
