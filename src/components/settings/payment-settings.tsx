'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserSettings } from '@/lib/types';
import { savePaymentSecrets } from '@/app/actions/payment';

interface PaymentSettingsProps {
    settings: Partial<UserSettings>;
    onSettingsChange: (settings: Partial<UserSettings>) => void;
    disabled?: boolean;
}

export function PaymentSettings({ settings, onSettingsChange, disabled }: PaymentSettingsProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const paymentConfig = settings.paymentConfig || { provider: 'mpesa-manual' };

    // Local state for secrets - never lifted up to parent
    const [pesapalSecrets, setPesapalSecrets] = useState({ key: '', secret: '' });
    const [mpesaSecrets, setMpesaSecrets] = useState({ key: '', secret: '', passKey: '' });
    const [airtelSecrets, setAirtelSecrets] = useState({ clientId: '', clientSecret: '' });

    const updateConfig = (updates: any) => {
        onSettingsChange({
            ...settings,
            paymentConfig: {
                ...paymentConfig,
                ...updates
            } as any
        });
    };

    const handleSaveSecrets = (provider: string) => {
        let secrets: any = {};
        if (provider === 'pesapal') {
            if (!pesapalSecrets.key || !pesapalSecrets.secret) {
                toast({ title: "Missing Fields", description: "Please enter both Key and Secret", variant: "destructive" });
                return;
            }
            secrets = { consumerKey: pesapalSecrets.key, consumerSecret: pesapalSecrets.secret };
        } else if (provider === 'mpesa-direct') {
            if (!mpesaSecrets.key || !mpesaSecrets.secret || !mpesaSecrets.passKey) {
                toast({ title: "Missing Fields", description: "Please enter Key, Secret and Passkey", variant: "destructive" });
                return;
            }
            secrets = { consumerKey: mpesaSecrets.key, consumerSecret: mpesaSecrets.secret, passKey: mpesaSecrets.passKey };
        } else if (provider === 'airtel-api') {
            if (!airtelSecrets.clientId || !airtelSecrets.clientSecret) {
                toast({ title: "Missing Fields", description: "Please enter Client ID and Secret", variant: "destructive" });
                return;
            }
            secrets = { clientId: airtelSecrets.clientId, clientSecret: airtelSecrets.clientSecret };
        }

        startTransition(async () => {
            try {
                await savePaymentSecrets(provider, secrets);
                toast({
                    title: "Credentials Saved Securely",
                    description: "Your API keys have been encrypted and stored. They will not be visible again.",
                });
                // Clear local state
                setPesapalSecrets({ key: '', secret: '' });
                setMpesaSecrets({ key: '', secret: '', passKey: '' });
                setAirtelSecrets({ clientId: '', clientSecret: '' });
            } catch (error: any) {
                toast({
                    title: "Save Failed",
                    description: error.message,
                    variant: "destructive"
                });
            }
        });
    };

    return (
        <Card className="border-0 shadow-md">
            <CardHeader>
                <CardTitle>Payment Integration</CardTitle>
                <CardDescription>
                    Configure how you want to receive payments.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="payment-provider">Payment Provider</Label>
                        <Select
                            disabled={disabled}
                            value={paymentConfig.provider || 'mpesa-manual'}
                            onValueChange={(v) => updateConfig({ provider: v })}
                        >
                            <SelectTrigger id="payment-provider"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mpesa-manual">M-Pesa Paybill / Till (Manual)</SelectItem>
                                <SelectItem value="mpesa-direct">M-Pesa API (Direct / Daraja)</SelectItem>
                                <SelectItem value="airtel-manual">Airtel Money Till (Manual)</SelectItem>
                                <SelectItem value="airtel-api">Airtel Money API (Direct)</SelectItem>
                                <SelectItem value="pesapal">Pesapal (Automated)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {paymentConfig.provider === 'pesapal' && (
                        <div className="space-y-4 border-l-2 border-blue-500 pl-4 bg-blue-50/10 p-4 rounded-r-md">
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldCheck className="h-5 w-5 text-blue-600" />
                                <h4 className="font-semibold text-blue-800">Secure Configuration</h4>
                            </div>
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="pesapal-key">Consumer Key</Label>
                                    <Input
                                        id="pesapal-key"
                                        type="password"
                                        disabled={disabled || isPending}
                                        placeholder="Enter to update..."
                                        value={pesapalSecrets.key}
                                        onChange={(e) => setPesapalSecrets({ ...pesapalSecrets, key: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pesapal-secret">Consumer Secret</Label>
                                    <Input
                                        id="pesapal-secret"
                                        type="password"
                                        disabled={disabled || isPending}
                                        placeholder="Enter to update..."
                                        value={pesapalSecrets.secret}
                                        onChange={(e) => setPesapalSecrets({ ...pesapalSecrets, secret: e.target.value })}
                                    />
                                </div>
                                <Button
                                    onClick={() => handleSaveSecrets('pesapal')}
                                    disabled={isPending || !pesapalSecrets.key}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Pesapal Credentials
                                </Button>
                            </div>
                        </div>
                    )}

                    {paymentConfig.provider === 'mpesa-direct' && (
                        <div className="space-y-4 border-l-2 border-green-600 pl-4 bg-green-50/10 p-4 rounded-r-md">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="mpesa-env">Environment</Label>
                                    <Select
                                        disabled={disabled}
                                        value={paymentConfig.mpesa_api?.environment || 'sandbox'}
                                        onValueChange={(v) => updateConfig({
                                            mpesa_api: { ...paymentConfig.mpesa_api, environment: v }
                                        })}
                                    >
                                        <SelectTrigger id="mpesa-env"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sandbox">Sandbox (Test)</SelectItem>
                                            <SelectItem value="production">Production (Live)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mpesa-shortcode">Shortcode (Paybill/Till)</Label>
                                    <Input
                                        id="mpesa-shortcode"
                                        disabled={disabled}
                                        placeholder="e.g. 174379"
                                        value={paymentConfig.mpesa_api?.shortcode || ''}
                                        onChange={(e) => updateConfig({
                                            mpesa_api: { ...paymentConfig.mpesa_api, shortcode: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-white/50 rounded-md border border-green-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <ShieldCheck className="h-4 w-4 text-green-700" />
                                    <span className="font-semibold text-sm text-green-800">API Credentials (Write Only)</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="mpesa-key">Consumer Key</Label>
                                        <Input
                                            id="mpesa-key"
                                            type="password"
                                            disabled={disabled || isPending}
                                            placeholder="Enter to update..."
                                            value={mpesaSecrets.key}
                                            onChange={(e) => setMpesaSecrets({ ...mpesaSecrets, key: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mpesa-secret">Consumer Secret</Label>
                                        <Input
                                            id="mpesa-secret"
                                            type="password"
                                            disabled={disabled || isPending}
                                            placeholder="Enter to update..."
                                            value={mpesaSecrets.secret}
                                            onChange={(e) => setMpesaSecrets({ ...mpesaSecrets, secret: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mpesa-passkey">Lipa Na M-Pesa Passkey</Label>
                                        <Input
                                            id="mpesa-passkey"
                                            type="password"
                                            disabled={disabled || isPending}
                                            placeholder="Enter to update..."
                                            value={mpesaSecrets.passKey}
                                            onChange={(e) => setMpesaSecrets({ ...mpesaSecrets, passKey: e.target.value })}
                                        />
                                    </div>
                                    <Button
                                        onClick={() => handleSaveSecrets('mpesa-direct')}
                                        disabled={isPending || !mpesaSecrets.key}
                                        className="w-full bg-green-600 hover:bg-green-700 mt-2"
                                    >
                                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Save M-Pesa Credentials
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {paymentConfig.provider === 'airtel-api' && (
                        <div className="space-y-4 border-l-2 border-red-500 pl-4 bg-red-50/10 p-4 rounded-r-md">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="airtel-env">Environment</Label>
                                    <Select
                                        disabled={disabled}
                                        value={paymentConfig.airtel_api?.environment || 'sandbox'}
                                        onValueChange={(v) => updateConfig({
                                            airtel_api: { ...paymentConfig.airtel_api, environment: v }
                                        })}
                                    >
                                        <SelectTrigger id="airtel-env"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sandbox">Sandbox (Test)</SelectItem>
                                            <SelectItem value="production">Production (Live)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="airtel-merchant">Merchant ID</Label>
                                    <Input
                                        id="airtel-merchant"
                                        disabled={disabled}
                                        placeholder="e.g. M123456"
                                        value={paymentConfig.airtel_api?.merchantId || ''}
                                        onChange={(e) => updateConfig({
                                            airtel_api: { ...paymentConfig.airtel_api, merchantId: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-white/50 rounded-md border border-red-200">
                                <div className="flex items-center gap-2 mb-3">
                                    <ShieldCheck className="h-4 w-4 text-red-700" />
                                    <span className="font-semibold text-sm text-red-800">API Credentials (Write Only)</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="airtel-client-id">Client ID</Label>
                                        <Input
                                            id="airtel-client-id"
                                            type="password"
                                            disabled={disabled || isPending}
                                            placeholder="Enter to update..."
                                            value={airtelSecrets.clientId}
                                            onChange={(e) => setAirtelSecrets({ ...airtelSecrets, clientId: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="airtel-secret">Client Secret</Label>
                                        <Input
                                            id="airtel-secret"
                                            type="password"
                                            disabled={disabled || isPending}
                                            placeholder="Enter to update..."
                                            value={airtelSecrets.clientSecret}
                                            onChange={(e) => setAirtelSecrets({ ...airtelSecrets, clientSecret: e.target.value })}
                                        />
                                    </div>
                                    <Button
                                        onClick={() => handleSaveSecrets('airtel-api')}
                                        disabled={isPending || !airtelSecrets.clientId}
                                        className="w-full bg-red-600 hover:bg-red-700 mt-2"
                                    >
                                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Save Airtel Credentials
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Manual providers remain the same (no secrets) */}
                    {paymentConfig.provider === 'airtel-manual' && (
                        <div className="space-y-3 border-l-2 border-red-500 pl-4 bg-red-50/10 p-3 rounded-r-md">
                            <div className="space-y-2">
                                <Label htmlFor="airtel-till">Airtel Money Till / Paybill</Label>
                                <Input
                                    id="airtel-till"
                                    disabled={disabled}
                                    placeholder="e.g. 600600"
                                    value={paymentConfig.airtel?.tillNumber || ''}
                                    onChange={(e) => updateConfig({
                                        airtel: { tillNumber: e.target.value }
                                    })}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Tenants will be instructed to send money to this number. You will need to manually verify receipt.
                            </p>
                        </div>
                    )}

                    {paymentConfig.provider === 'mpesa-manual' && (
                        <div className="space-y-3 border-l-2 border-green-500 pl-4 bg-green-50/10 p-3 rounded-r-md">
                            <div className="space-y-2">
                                <Label htmlFor="mpesa-paybill">Paybill / Till Number</Label>
                                <Input
                                    id="mpesa-paybill"
                                    disabled={disabled}
                                    placeholder="e.g. 522522 or 123456"
                                    value={paymentConfig.mpesa?.paybillNumber || ''}
                                    onChange={(e) => updateConfig({
                                        mpesa: { ...paymentConfig.mpesa, paybillNumber: e.target.value }
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mpesa-prefix">Account Number Prefix (Optional)</Label>
                                <Input
                                    id="mpesa-prefix"
                                    disabled={disabled}
                                    placeholder="e.g. APT- (Tenants will add their unit number)"
                                    value={paymentConfig.mpesa?.accountNumberPrefix || ''}
                                    onChange={(e) => updateConfig({
                                        mpesa: { ...paymentConfig.mpesa, accountNumberPrefix: e.target.value }
                                    })}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Tenants will be instructed to pay to this number. Manual verification required.
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
