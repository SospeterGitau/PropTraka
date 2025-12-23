import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, FileText, Wrench, Home, ArrowUpRight, AlertCircle, CheckCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState } from 'react';
import { MpesaPaymentDialog } from '@/components/checkout/mpesa-dialog';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock Data for Tenant
const tenantData = {
    name: "Alex Doe",
    unit: "Apartment 4B",
    property: "Kileleshwa Heights, Nairobi",
    balance: 0,
    leaseEnd: "2026-12-31",
    leaseStatus: "Active",
    nextPayment: "2026-01-05",
    rentAmount: 45000,
    paybill: "247247",
    accountNumber: "APT-4B",
    payments: [
        { id: 1, date: "Dec 1, 2025", amount: 45000, method: "M-PESA", status: "Success" },
        { id: 2, date: "Nov 1, 2025", amount: 45000, method: "M-PESA", status: "Success" },
    ],
    documents: [
        { id: 1, name: "Lease Agreement", date: "Jan 1, 2024", type: "PDF" },
        { id: 2, name: "House Rules", date: "Jan 1, 2024", type: "PDF" },
    ]
};

export default function TenantDashboard() {
    const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const { toast } = useToast();

    const handleDownload = (docName: string) => {
        toast({
            title: "Download Started",
            description: `Downloading ${docName}...`,
        });
        // In real app, trigger file download from URL
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-indigo-900/60 mb-1">
                        <Home className="h-4 w-4" />
                        <span className="text-sm font-medium">Tenant Portal</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">{tenantData.unit}</h1>
                    <p className="text-slate-600">{tenantData.property}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-3">
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/20 border-0"
                            onClick={() => setIsPaymentOpen(true)}
                        >
                            <span className="mr-2">Pay with M-PESA</span>
                            <ArrowUpRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="text-xs text-right text-slate-500 bg-white/50 px-3 py-1 rounded-full border border-slate-200">
                        <span className="font-semibold">Paybill:</span> {tenantData.paybill} &bull; <span className="font-semibold">Acc:</span> {tenantData.accountNumber}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-xl shadow-indigo-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Current Balance</CardTitle>
                        <CreditCard className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">KES {tenantData.balance.toLocaleString()}</div>
                        <p className="text-xs text-slate-500 mt-1">Next payment of KES {tenantData.rentAmount.toLocaleString()} due {tenantData.nextPayment}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-xl shadow-indigo-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Lease Status</CardTitle>
                        <FileText className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-600">{tenantData.leaseStatus}</div>
                        <p className="text-xs text-slate-500 mt-1">Expires {tenantData.leaseEnd}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/60 backdrop-blur-xl border-white/20 shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Dialog open={isMaintenanceOpen} onOpenChange={setIsMaintenanceOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="secondary" className="h-8 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
                                    Report Issue
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Report Maintenance Issue</DialogTitle>
                                    <DialogDescription>
                                        Describe the issue in your unit. We'll alert the property manager immediately.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="subject">Issue Type</Label>
                                        <Select>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="plumbing">Plumbing</SelectItem>
                                                <SelectItem value="electrical">Electrical</SelectItem>
                                                <SelectItem value="appliance">Appliance</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="priority">Priority</Label>
                                        <Select>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select priority" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low - It can wait</SelectItem>
                                                <SelectItem value="medium">Medium - Fix soon</SelectItem>
                                                <SelectItem value="high">High - Emergency</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea id="description" placeholder="Please describe the problem..." />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" onClick={() => setIsMaintenanceOpen(false)}>Submit Request</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Open Requests</CardTitle>
                        <Wrench className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">0</div>
                        <div className="flex items-center gap-2 mt-1">
                            <CheckCircle className="h-3 w-3 text-emerald-500" />
                            <p className="text-xs text-slate-500">Everything is working fine.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-white/60 backdrop-blur-xl border-white/20 shadow-xl shadow-indigo-500/5">
                    <CardHeader>
                        <CardTitle className="text-slate-900">Recent Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {tenantData.payments.map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                    <div>
                                        <div className="font-medium text-slate-900">Rent Payment</div>
                                        <div className="text-sm text-slate-500">{payment.date} • {payment.method}</div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div>
                                            <div className="font-medium text-slate-900">- KES {payment.amount.toLocaleString()}</div>
                                            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                                                {payment.status}
                                            </Badge>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => handleDownload(`Receipt-${payment.id}.pdf`)}>
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3 bg-white/60 backdrop-blur-xl border-white/20 shadow-xl shadow-indigo-500/5">
                    <CardHeader>
                        <CardTitle className="text-slate-900">Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {tenantData.documents.map((doc) => (
                                <div key={doc.id} className="flex items-center gap-4 rounded-xl border border-white/50 bg-white/40 p-3 hover:bg-white/60 cursor-pointer transition-all hover:shadow-sm">
                                    <div className={`rounded-full p-2 ${doc.name.includes('Lease') ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-sm text-slate-900">{doc.name}</div>
                                        <div className="text-xs text-slate-500">{doc.type} • {doc.date}</div>
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-indigo-600" onClick={() => handleDownload(doc.name)}>
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>


            <MpesaPaymentDialog
                open={isPaymentOpen}
                onOpenChange={setIsPaymentOpen}
                amount={tenantData.rentAmount}
                reference={tenantData.accountNumber}
                tenantId="tenant-123" // Mock
                propertyId="prop-456" // Mock
                email="tenant@example.com" // Mock
                onSuccess={() => {
                    toast({
                        title: "Payment Initiated",
                        description: "Check your phone to complete the transaction.",
                    });
                }}
            />
        </div >
    );
}
