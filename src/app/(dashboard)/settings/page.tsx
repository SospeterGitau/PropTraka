
'use client';



import React from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useDataContext } from '@/context/data-context';



const ProfileSettingsTab = dynamic(() => import('@/components/settings/profile-settings-tab'), {
  loading: () => <Skeleton className="h-96 w-full" />,
});
const SubscriptionBillingTab = dynamic(() => import('@/components/settings/subscription-billing-tab'), {
  loading: () => <Skeleton className="h-96 w-full" />,
});
const ApiAccessTab = dynamic(() => import('@/components/settings/api-access-tab'), {
  loading: () => <Skeleton className="h-96 w-full" />,
});
const KnowledgeBaseTab = dynamic(() => import('@/components/settings/knowledge-base-tab'), {
  loading: () => <Skeleton className="h-96 w-full" />,
});




const SettingsTabs = () => {
    const { settings } = useDataContext();
    const isDevelopment = process.env.NODE_ENV === 'development';



    if (!settings) {
        return (
            <div className="mb-6">
                <Skeleton className="h-10 w-full max-w-lg" />
            </div>
        );
    }
    
    // In development: show to all users for testing
    // In production: only show to Enterprise users
    const isEnterprise = isDevelopment;



    return (
        <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-lg mb-6">
                <TabsTrigger value="profile">Profile &amp; Settings</TabsTrigger>
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
                {isEnterprise && <TabsTrigger value="api-access">API Access</TabsTrigger>}
                {isDevelopment && <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="profile">
                <ProfileSettingsTab />
            </TabsContent>
            <TabsContent value="subscription">
                <SubscriptionBillingTab />
            </TabsContent>
            {isEnterprise && (
                <TabsContent value="api-access">
                    <ApiAccessTab />
                </TabsContent>
            )}
            {isDevelopment && (
                <TabsContent value="knowledge">
                    <KnowledgeBaseTab />
                </TabsContent>
            )}
        </Tabs>
    );
};




export default function AccountPage() {
  return (
    <>
      <PageHeader title="Account" />
      <SettingsTabs />
    </>
  );
}
