
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { useDataContext } from '@/context/data-context';
import { useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const plans = [
    {
        name: 'Free Plan',
        price: 'KES 0/month',
        features: [
            'Up to 3 Properties',
            'Basic Reporting',
            'Manual Data Entry',
        ],
        isCurrent: false,
    },
    {
        name: 'Pro Plan',
        price: 'KES 2,500/month',
        features: [
            'Unlimited Properties',
            'AI-Powered Reporting',
            'Tenant Payment Requests (soon)',
            'Priority Support',
        ],
        isCurrent: true,
    }
]

export default function SubscriptionPage() {
  const { subscriptions, addSubscription, isDataLoading } = useDataContext();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const currentSubscription = subscriptions?.[0];

  const handleChoosePlan = (planName: string) => {
    startTransition(async () => {
      // In a real app, this would trigger a payment flow via Pesapal/InstaSend.
      // For now, we simulate creating a subscription record.
      try {
        await addSubscription({
            plan: planName as "Free" | "Pro",
            status: 'active',
            billingCycle: 'monthly',
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        });
        toast({
            title: "Subscription Updated",
            description: `You are now on the ${planName}.`,
        });
      } catch (error) {
        toast({
            variant: 'destructive',
            title: "Error",
            description: "Could not update your subscription.",
        });
      }
    });
  }

  if (isDataLoading) {
     return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Subscription & Billing" />

      {currentSubscription ? (
        // Display current subscription and billing history
        <div className="grid gap-6 md:grid-cols-3">
             <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>Manage your subscription and see plan details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                        <h3 className="text-lg font-semibold">{currentSubscription.plan} Plan</h3>
                        <p className="text-muted-foreground">KES {currentSubscription.plan === 'Pro' ? '2,500' : '0'}/month</p>
                        </div>
                        <Badge variant={currentSubscription.status === 'active' ? 'secondary' : 'destructive'} className="capitalize">
                        {currentSubscription.status}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Your plan renews on {format(new Date(currentSubscription.currentPeriodEnd), 'MMMM dd, yyyy')}.
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" disabled>Change Plan</Button>
                        <Button variant="destructive" disabled>Cancel Subscription</Button>
                    </div>
                    </CardContent>
                </Card>
             </div>
             <div className="space-y-6">
                <Card>
                    <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                        <CreditCard className="h-8 w-8 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">M-Pesa</p>
                            <p className="text-sm text-muted-foreground">*******321</p>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full" disabled>Update Payment Method</Button>
                    </CardContent>
                </Card>
             </div>
        </div>
      ) : (
        // Display plan selection for new users
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold">Choose Your Plan</h2>
                <p className="text-muted-foreground mt-2">Select the plan that best fits your needs.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {plans.map((plan) => (
                    <Card key={plan.name} className="flex flex-col">
                        <CardHeader>
                            <CardTitle>{plan.name}</CardTitle>
                            <CardDescription className="text-2xl font-bold">{plan.price}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                             <ul className="space-y-3 text-sm">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-primary" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <div className="p-6 pt-0">
                            <Button 
                                className="w-full" 
                                onClick={() => handleChoosePlan(plan.name.split(' ')[0])}
                                disabled={isPending}
                            >
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Choose Plan'}
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
      )}
    </>
  );
}
