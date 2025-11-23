
'use client';

import React, { useState, useTransition } from 'react';
import { useDataContext } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { SubscriptionPlan } from '@/lib/types';
import allPlans from '@/lib/subscription-plans.json';
import allFeatures from '@/lib/app-features.json';
import Link from 'next/link';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Check } from 'lucide-react';

const PlanPrice = ({ plan, billingCycle }: { plan: SubscriptionPlan, billingCycle: 'monthly' | 'yearly' }) => {
    const price = billingCycle === 'yearly'
        ? plan.price !== null ? plan.price * 12 * 0.85 : null // 15% discount for yearly
        : plan.price;

    return (
        <div className="flex items-baseline justify-center gap-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {plan.price !== null ? (
                <>
                    <span className="text-muted-foreground text-xl sm:text-2xl">KSh</span>
                    <span>{Math.round(price!).toLocaleString()}</span>
                    <span className="text-muted-foreground">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                </>
            ) : (
                <span className="text-3xl">Custom</span>
            )}
        </div>
    );
};


export default function SubscriptionBillingTab() {
    const { settings } = useDataContext();
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    
    const currentPlanName = settings.subscription?.plan || 'Starter';
  
    const handleChoosePlan = (planName: string) => {
        if(planName === currentPlanName) return;

        startTransition(async () => {
          toast({
              title: "Confirm Subscription",
              description: `This is where you would integrate with IntaSend to change the plan to ${planName}.`,
          });
        });
    }

    const featureGroups = [
        {
            name: "Core Management",
            features: ["rent_tracking", "expense_tracking", "contractor_management", "document_linking", "maintenance_logs"]
        },
        {
            name: "Financial Tools",
            features: ["arrears_management", "basic_analytics", "advanced_ai_reports"]
        },
        {
            name: "Productivity & AI",
            features: ["maintenance_workflow", "ai_lease_clauses", "ai_chat_assistant"]
        },
        {
            name: "Support & Access",
            features: ["email_support", "chat_support", "phone_support", "dedicated_support", "api_access"]
        }
    ];

    const allGroupedFeatureIds = new Set(featureGroups.flatMap(g => g.features));
    const ungroupedFeatures = allFeatures.filter(f => !allGroupedFeatureIds.has(f.id));
    if (ungroupedFeatures.length > 0) {
        featureGroups.push({ name: "Other", features: ungroupedFeatures.map(f => f.id) });
    }
  
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Choose Your Plan</h2>
                <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Select the plan that best fits the size and needs of your property portfolio.</p>
            </div>

            <div className="flex justify-center">
                <ToggleGroup type="single" value={billingCycle} onValueChange={(value: 'monthly' | 'yearly') => value && setBillingCycle(value)} defaultValue="monthly">
                    <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
                    <ToggleGroupItem value="yearly">Yearly (Save 15%)</ToggleGroupItem>
                </ToggleGroup>
            </div>
            
             <div className="w-full overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[200px] p-2"></TableHead>
                            {allPlans.map(plan => {
                                const isCurrent = plan.name === currentPlanName;
                                const isMostPopular = plan.name === 'Professional';
                                return (
                                    <TableHead key={plan.id} className={cn("w-[220px] p-4 text-center border-l", isCurrent && "bg-primary/10")}>
                                       <div className="flex flex-col items-center justify-start h-full">
                                            <div className="flex flex-col items-center justify-center h-8">
                                                {isMostPopular ? (
                                                     <Badge variant="secondary" className="font-semibold">
                                                        <Star className="mr-2 h-4 w-4 fill-yellow-400 text-yellow-500" />
                                                        Most Popular
                                                    </Badge>
                                                ) : (
                                                    <div className="h-6" /> // Placeholder for alignment
                                                )}
                                            </div>
                                            <h3 className="text-2xl font-bold text-foreground mt-2">{plan.name}</h3>
                                            <p className="text-sm text-muted-foreground min-h-[40px] mt-2 mb-2 flex-grow">{plan.description}</p>
                                            <div className="my-4 text-3xl font-bold tracking-tight sm:text-4xl"><PlanPrice plan={plan as SubscriptionPlan} billingCycle={billingCycle} /></div>
                                            <Button
                                                className="w-full mt-auto"
                                                variant={isCurrent ? 'secondary' : (isMostPopular ? 'default' : 'outline')}
                                                onClick={() => handleChoosePlan(plan.name)}
                                                disabled={isCurrent}
                                            >
                                                {isCurrent ? 'Your Plan' : 'Choose Plan'}
                                            </Button>
                                        </div>
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {featureGroups.map(group => (
                            <React.Fragment key={group.name}>
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={allPlans.length + 1} className="py-4">
                                        <h4 className="text-lg font-semibold">{group.name}</h4>
                                    </TableCell>
                                </TableRow>
                                {group.features.map(featureId => {
                                    const feature = allFeatures.find(f => f.id === featureId);
                                    if (!feature) return null;
                                    return (
                                        <TableRow key={feature.id} className="hover:bg-muted/50 transition-colors">
                                            <TableCell className="font-medium p-3">
                                                {feature.page_url ? (
                                                    <Link href={feature.page_url} className="hover:underline">{feature.name}</Link>
                                                ) : (
                                                    <span>{feature.name}</span>
                                                )}
                                            </TableCell>
                                            {allPlans.map(plan => (
                                                <TableCell key={plan.id} className={cn("text-center border-l p-3", plan.name === currentPlanName && "bg-primary/10")}>
                                                    {plan.features.includes(feature.id) ? (
                                                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                                                    ) : (
                                                        <span className="text-muted-foreground text-lg">&ndash;</span>
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    )
                                })}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
