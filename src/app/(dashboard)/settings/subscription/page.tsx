
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, CreditCard, ExternalLink } from 'lucide-react';

// This is mock data. In a real application, this would come from your backend.
const subscription = {
  plan: 'Pro Plan',
  status: 'active',
  price: 'KES 2,500/month',
  nextBillingDate: '2024-08-15',
};

const billingHistory = [
  { id: 'inv-001', date: '2024-07-15', amount: 'KES 2,500', status: 'Paid' },
  { id: 'inv-002', date: '2024-06-15', amount: 'KES 2,500', status: 'Paid' },
  { id: 'inv-003', date: '2024-05-15', amount: 'KES 2,500', status: 'Paid' },
];

const paymentMethod = {
  type: 'M-Pesa',
  details: '*******321',
};


export default function SubscriptionPage() {

  return (
    <>
      <PageHeader title="Subscription & Billing" />

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
                  <h3 className="text-lg font-semibold">{subscription.plan}</h3>
                  <p className="text-muted-foreground">{subscription.price}</p>
                </div>
                <Badge variant={subscription.status === 'active' ? 'secondary' : 'destructive'} className="capitalize">
                  {subscription.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Your plan renews on {subscription.nextBillingDate}.
              </p>
              <div className="flex gap-2">
                 <Button variant="outline">Change Plan</Button>
                 <Button variant="destructive">Cancel Subscription</Button>
              </div>
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>Review your past payments to LeaseLync.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.amount}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.status}</Badge>
                      </TableCell>
                       <TableCell className="text-right">
                         <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View
                         </Button>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                    <p className="font-semibold">{paymentMethod.type}</p>
                    <p className="text-sm text-muted-foreground">{paymentMethod.details}</p>
                  </div>
               </div>
               <Button variant="outline" className="w-full">Update Payment Method</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pro Plan Features</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Unlimited Properties</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>AI-Powered Reporting</span>
                    </li>
                     <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Tenant Payment Requests</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Priority Support</span>
                    </li>
                </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
