'use client';

import { useState } from 'react';
import { Tenant } from '@/lib/db-types';
import { calculateTrustScore, getTrustLevel } from '@/lib/trust-score';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Upload, ShieldCheck, UserCheck, Smartphone } from 'lucide-react';
import { IDKitWidget, VerificationLevel, ISuccessResult } from '@worldcoin/idkit';

interface TenantVerificationProps {
    tenant: Tenant;
    onUpdate: (updates: Partial<Tenant>) => void;
}

export function TenantVerification({ tenant, onUpdate }: TenantVerificationProps) {
    const [activeTab, setActiveTab] = useState('status');
    const [voucherEmail, setVoucherEmail] = useState('');

    const trustScore = calculateTrustScore(tenant);
    const trustLevel = getTrustLevel(trustScore);

    // Mock upload handler
    const handleFileUpload = (type: 'ID_FRONT' | 'SELFIE') => {
        // In a real app, this would upload to Firebase Storage
        const newDocs = [...(tenant.identityDocuments || [])];
        newDocs.push({
            type,
            url: `https://mock.url/${type.toLowerCase()}.jpg`,
            status: 'Verified', // Auto-verify for demo
            uploadedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
        });

        onUpdate({ identityDocuments: newDocs });
    };

    const handleVouchRequest = () => {
        if (!voucherEmail) return;
        const newVouches = [...(tenant.vouchingRequests || [])];
        newVouches.push({
            voucherEmail,
            status: 'Pending',
            relationship: 'Previous Landlord',
            requestedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
        });
        onUpdate({ vouchingRequests: newVouches });
        setVoucherEmail('');
    };

    const handleWorldIdSuccess = (result: ISuccessResult) => {
        // In a real app, you would verify this proof on your backend
        console.log("World ID Proof:", result);
        onUpdate({
            worldIdHash: result.nullifier_hash,
            verificationStatus: 'Verified'
        });
    };

    return (
        <div className="space-y-6">
            {/* 1. Trust Score Header */}
            <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xl">Identity Trust Score</CardTitle>
                        <Badge variant={trustScore >= 80 ? 'default' : 'secondary'} className="text-lg px-3 py-1">
                            {trustScore}/100
                        </Badge>
                    </div>
                    <CardDescription>
                        Current Level: <span className={`font-bold ${trustLevel.color}`}>{trustLevel.label}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Progress value={trustScore} className="h-3" />
                    <p className="text-xs text-muted-foreground mt-2">
                        Higher scores unlock premium features and lower deposit requirements.
                    </p>
                </CardContent>
            </Card>

            {/* 2. Verification Tabs */}
            <Tabs defaultValue="status" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="status">Status</TabsTrigger>
                    <TabsTrigger value="docs">Docs</TabsTrigger>
                    <TabsTrigger value="vouch">Vouch</TabsTrigger>
                    <TabsTrigger value="worldid" className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                        World ID
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Status Summary */}
                <TabsContent value="status" className="space-y-4 mt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <VerificationItem
                            icon={<Smartphone className="h-5 w-5" />}
                            label="Phone Verified"
                            status={tenant.phoneNumber ? 'Verified' : 'Pending'}
                        />
                        <VerificationItem
                            icon={<UserCheck className="h-5 w-5" />}
                            label="ID Document"
                            status={tenant.identityDocuments?.some(d => d.type === 'ID_FRONT') ? 'Verified' : 'Pending'}
                        />
                        <VerificationItem
                            icon={<UserCheck className="h-5 w-5" />}
                            label="Selfie Check"
                            status={tenant.identityDocuments?.some(d => d.type === 'SELFIE') ? 'Verified' : 'Pending'}
                        />
                        <VerificationItem
                            icon={<ShieldCheck className="h-5 w-5" />}
                            label="Social Vouch"
                            status={tenant.vouchingRequests?.some(v => v.status === 'Accepted') ? 'Verified' : 'Pending'}
                        />
                    </div>
                </TabsContent>

                {/* Tab: Documents (Atoms) */}
                <TabsContent value="docs" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Document Upload</CardTitle>
                            <CardDescription>Upload a clear photo of your National ID and a Selfie.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                                        <UserCheck className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">National ID / Passport</p>
                                        <p className="text-sm text-muted-foreground">Front side, clear text.</p>
                                    </div>
                                </div>
                                {tenant.identityDocuments?.some(d => d.type === 'ID_FRONT') ? (
                                    <Button variant="ghost" size="sm" className="text-green-600"><CheckCircle2 className="mr-2 h-4 w-4" /> Uploaded</Button>
                                ) : (
                                    <Button variant="outline" size="sm" onClick={() => handleFileUpload('ID_FRONT')}>
                                        <Upload className="mr-2 h-4 w-4" /> Upload
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                                        <UserCheck className="h-5 w-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Selfie Liveness</p>
                                        <p className="text-sm text-muted-foreground">Take a photo now.</p>
                                    </div>
                                </div>
                                {tenant.identityDocuments?.some(d => d.type === 'SELFIE') ? (
                                    <Button variant="ghost" size="sm" className="text-green-600"><CheckCircle2 className="mr-2 h-4 w-4" /> Posted</Button>
                                ) : (
                                    <Button variant="outline" size="sm" onClick={() => handleFileUpload('SELFIE')}>
                                        <Upload className="mr-2 h-4 w-4" /> Take Photo
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Vouching (Relation) */}
                <TabsContent value="vouch" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Social Vouching</CardTitle>
                            <CardDescription>Ask a previous landlord or employer to vouch for you.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="voucher@example.com"
                                    value={voucherEmail}
                                    onChange={(e) => setVoucherEmail(e.target.value)}
                                />
                                <Button onClick={handleVouchRequest}>Send Request</Button>
                            </div>
                            <div className="space-y-2 mt-4">
                                <h4 className="text-sm font-medium">Pending Requests</h4>
                                {tenant.vouchingRequests?.length === 0 && <p className="text-sm text-muted-foreground">No active requests.</p>}
                                {tenant.vouchingRequests?.map((req, i) => (
                                    <div key={i} className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                                        <span>{req.voucherEmail}</span>
                                        <Badge variant="outline">{req.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: World ID (Crypto) */}
                <TabsContent value="worldid" className="space-y-4 mt-4">
                    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Sign in with World ID
                            </CardTitle>
                            <CardDescription>
                                Verify you are a unique human without sharing personal data.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            {tenant.worldIdHash ? (
                                <div className="text-center space-y-2">
                                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-medium text-green-700">Verified Human</h3>
                                    <p className="text-sm text-muted-foreground">World ID Hash: {tenant.worldIdHash.slice(0, 8)}...</p>
                                </div>
                            ) : (
                                <div className="bg-white p-4 rounded-xl border shadow-sm">
                                    <IDKitWidget
                                        app_id="app_staging_1234567890" // Placeholder
                                        action="verify-tenant" // Placeholder
                                        verification_level={VerificationLevel.Device}
                                        handleVerify={async (proof) => {
                                            // Validate proof with backend here
                                            return;
                                        }}
                                        onSuccess={handleWorldIdSuccess}
                                    >
                                        {({ open }) => (
                                            <Button className="bg-black hover:bg-zinc-800 text-white w-full" onClick={open}>
                                                Verify with World ID
                                            </Button>
                                        )}
                                    </IDKitWidget>
                                    <p className="text-xs text-center mt-2 text-muted-foreground">Test Mode: Staging Credentials</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}

function VerificationItem({ icon, label, status }: { icon: any, label: string, status: string }) {
    const isVerified = status === 'Verified' || status === 'Accepted';
    return (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isVerified ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                    {icon}
                </div>
                <span className="font-medium">{label}</span>
            </div>
            <Badge variant={isVerified ? 'default' : 'secondary'}>{status}</Badge>
        </div>
    );
}
