
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { getAuth, updatePassword, updateProfile, updateEmail } from 'firebase/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useUser, useFirestore, useFirebase } from '@/firebase';
import { useTheme } from '@/context/theme-context';
import { useDataContext } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { logout } from '@/app/actions';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import type { ResidencyStatus, UserSettings } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Loader2, LogOut, Sun, Moon, Laptop, Trash2 } from 'lucide-react';

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfileSettingsTab() {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const { firestore } = useFirebase();
  const { settings, updateSettings, isLoading: isDataLoading } = useDataContext();

  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');

  const [tempSettings, setTempSettings] = useState(settings);
  const [originalSettings, setOriginalSettings] = useState(settings);

  const [isClearingChat, setIsClearingChat] = useState(false);
  const [isClearChatDialogOpen, setIsClearChatDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (!isEditing) {
      setTempSettings(settings);
    }
    setDisplayName(user?.displayName || '');
    setEmail(user?.email || '');
  }, [settings, user, isEditing]);

  useEffect(() => {
    if (!isEditing || !tempSettings) return;

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let effectiveTheme = tempSettings.theme || 'system';
    if (effectiveTheme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.classList.add(effectiveTheme);

    return () => {
      const globalTheme = settings?.theme || 'system';
      let effectiveGlobalTheme = globalTheme;
      if (effectiveGlobalTheme === 'system') {
        effectiveGlobalTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      root.classList.remove('light', 'dark');
      root.classList.add(effectiveGlobalTheme);
    }
  }, [isEditing, tempSettings?.theme, settings?.theme]);

  useEffect(() => {
    if (!isEditing) return;

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let effectiveTheme = tempSettings?.theme || 'system';
    if (effectiveTheme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.classList.add(effectiveTheme);

    return () => {
      const globalTheme = settings?.theme || 'system';
      let effectiveGlobalTheme = globalTheme;
      if (effectiveGlobalTheme === 'system') {
        effectiveGlobalTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      root.classList.remove('light', 'dark');
      root.classList.add(effectiveGlobalTheme);
    }
  }, [isEditing, tempSettings?.theme, settings?.theme]);

  const handleEdit = () => {
    setOriginalSettings(settings);
    setTempSettings(settings);
    setDisplayName(user?.displayName || '');
    setEmail(user?.email || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      let profileUpdated = false;
      let emailUpdated = false;

      try {
        if (displayName !== currentUser.displayName) {
          await updateProfile(currentUser, { displayName });
          profileUpdated = true;
        }

        if (email !== currentUser.email) {
          await updateEmail(currentUser, email);
          emailUpdated = true;
        }

        await updateSettings(tempSettings ?? {});
        if (tempSettings?.theme) {
          setTheme(tempSettings.theme)
        }

        if (profileUpdated || emailUpdated) {
          toast({ title: "Profile Updated", description: "Your name and/or email have been changed." });
        }
        toast({ title: "Settings Saved", description: "Your preferences have been updated." });

      } catch (error: any) {
        if (error.code === 'auth/requires-recent-login') {
          toast({
            variant: 'destructive',
            title: 'Authentication Required',
            description: 'Changing your email is a sensitive action. Please sign out and sign in again before retrying.'
          });
        } else {
          toast({ variant: 'destructive', title: 'Update Error', description: error.message });
        }
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempSettings(originalSettings);
    setIsEditing(false);
  };

  const handleChangePassword = (data: PasswordFormValues) => {
    startPasswordTransition(async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to change your password.' });
        return;
      }

      try {
        await updatePassword(currentUser, data.newPassword);
        toast({ title: 'Success', description: 'Your password has been updated.' });
        setIsPasswordDialogOpen(false);
        reset();
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: 'This is a sensitive operation. Please sign out and sign back in before changing your password.' });
      }
    });
  };

  const handleClearChatHistory = async () => {
    if (!user || !firestore) return;
    setIsClearingChat(true);

    try {
      const q = query(collection(firestore, 'chatMessages'), where('ownerId', '==', user.uid));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast({ title: 'No Messages', description: 'Your chat history is already empty.' });
        setIsClearChatDialogOpen(false);
        setIsClearingChat(false);
        return;
      }

      const batch = writeBatch(firestore);
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      toast({ title: 'Chat History Cleared', description: 'Your conversation with the AI assistant has been reset.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not clear chat history. Please try again.' });
    } finally {
      setIsClearChatDialogOpen(false);
      setIsClearingChat(false);
    }
  }

  const handleClearTemplateField = (fieldName: keyof UserSettings) => {
    setTempSettings((prev) => ({ ...(prev ?? {}), [fieldName]: '' } as UserSettings));
  };


  if (isDataLoading || !tempSettings) {
    return <p>Loading settings...</p>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Profile & Settings</h2>
        <div className="flex justify-end min-w-[200px]">
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </>
            ) : (
              <Button onClick={handleEdit}>Edit</Button>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <fieldset disabled={!isEditing} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your account credentials and session.</CardDescription>
            </CardHeader>
            <CardContent>
              <fieldset className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Full Name</Label>
                    <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your full name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
                  </div>
                </div>
              </fieldset>
            </CardContent>
            <CardFooter className="border-t p-6 flex-col items-start gap-4">
              <div className="flex items-center justify-between w-full">
                <div>
                  <h3 className="font-medium">Password</h3>
                  <p className="text-sm text-muted-foreground">Change your password to secure your account.</p>
                </div>
                <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(true)}>
                  Change Password
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>This helps us tailor the experience to your needs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Your Role</Label>
                  <Select name="role" value={tempSettings.role} onValueChange={(v) => setTempSettings({ ...tempSettings, role: v as 'Individual Landlord' | 'Property Manager' | 'Real Estate Agent' | 'Investor' })}>
                    <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual Landlord">Individual Landlord</SelectItem>
                      <SelectItem value="Property Manager">Property Manager</SelectItem>
                      <SelectItem value="Real Estate Agent">Real Estate Agent</SelectItem>
                      <SelectItem value="Investor">Investor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolioSize">Portfolio Size</Label>
                  <Select name="portfolioSize" value={tempSettings.portfolioSize} onValueChange={(v) => setTempSettings({ ...tempSettings, portfolioSize: v as '1-5' | '6-20' | '21-50' | '50+' as '1-5' | '6-20' | '21-50' | '50+' })}>
                    <SelectTrigger><SelectValue placeholder="Select portfolio size" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-5">1-5 Units</SelectItem>
                      <SelectItem value="6-20">6-20 Units</SelectItem>
                      <SelectItem value="21-50">21-50 Units</SelectItem>
                      <SelectItem value="50+">50+ Units</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="areasOfInterest">Areas of Interest for Investment</Label>
                <Input id="areasOfInterest" value={(tempSettings.areasOfInterest || []).join(', ')} onChange={(e) => setTempSettings({ ...tempSettings, areasOfInterest: e.target.value.split(',').map(s => s.trim()) })} placeholder="e.g. Kilimani, Nyali, Nakuru Town" />
                <p className="text-xs text-muted-foreground">Separate multiple areas with a comma.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>This information will be used for invoices and payment processing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billingAddressLine1">Address Line 1</Label>
                  <Input id="billingAddressLine1" value={tempSettings.billingAddressLine1 || ''} onChange={(e) => setTempSettings({ ...tempSettings, billingAddressLine1: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingAddressLine2">Address Line 2 (or P.O. Box)</Label>
                  <Input id="billingAddressLine2" value={tempSettings.billingAddressLine2 || ''} onChange={(e) => setTempSettings({ ...tempSettings, billingAddressLine2: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billingCity">City</Label>
                  <Input id="billingCity" value={tempSettings.billingCity || ''} onChange={(e) => setTempSettings({ ...tempSettings, billingCity: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingCounty">County</Label>
                  <Input id="billingCounty" value={tempSettings.billingCounty || ''} onChange={(e) => setTempSettings({ ...tempSettings, billingCounty: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingPostalCode">Postal / Area Code</Label>
                  <Input id="billingPostalCode" value={tempSettings.billingPostalCode || ''} onChange={(e) => setTempSettings({ ...tempSettings, billingPostalCode: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billingCountry">Country</Label>
                  <Input id="billingCountry" value={tempSettings.billingCountry || ''} onChange={(e) => setTempSettings({ ...tempSettings, billingCountry: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vatPin">VAT / KRA PIN (Optional)</Label>
                  <Input id="vatPin" value={tempSettings.vatPin || ''} onChange={(e) => setTempSettings({ ...tempSettings, vatPin: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document Templates</CardTitle>
              <CardDescription>Please provide links to your documents stored in your cloud storage provider (e.g., Google Drive, Dropbox).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: 'templateApplicationFormUrl', label: 'Application Form Template URL' },
                { id: 'templateLandlordAssessmentFormUrl', label: 'Landlord Assessment Form URL' },
                { id: 'templateTenancyAgreementUrl', label: 'Tenancy Agreement Template URL' },
                { id: 'templateMoveInChecklistUrl', label: 'Move-in Checklist Template URL' },
                { id: 'templateMoveOutChecklistUrl', label: 'Move-out Checklist Template URL' },
              ].map(field => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id}>{field.label}</Label>
                  <div className="relative">
                    <Input
                      id={field.id}
                      value={tempSettings[field.id as keyof UserSettings] as string || ''}
                      onChange={(e) => setTempSettings({ ...tempSettings, [field.id]: e.target.value })}
                      placeholder="https://docs.google.com/document/..."
                      className="pr-10"
                    />
                    {isEditing && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleClearTemplateField(field.id as keyof UserSettings)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>


          <Card>
            <CardHeader>
              <CardTitle>Reporting</CardTitle>
              <CardDescription>Customise details for your financial reports.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={tempSettings.companyName} onChange={(e) => setTempSettings({ ...tempSettings, companyName: e.target.value })} placeholder="Your Company Ltd." />
              </div>
              <div className="space-y-2">
                <Label>Residency Status (for Tax Calculation)</Label>
                <RadioGroup value={tempSettings.residencyStatus} onValueChange={(v) => setTempSettings({ ...tempSettings, residencyStatus: v as ResidencyStatus })} className="flex gap-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="resident" id="resident" />
                    <Label htmlFor="resident">Resident</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non-resident" id="non-resident" />
                    <Label htmlFor="non-resident">Non-Resident</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regional</CardTitle>
              <CardDescription>Set your currency and date format preferences.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={tempSettings.currency} onValueChange={(v) => setTempSettings({ ...tempSettings, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date Format</Label>
                <Select value={tempSettings.locale || 'en-KE'} onValueChange={(v) => setTempSettings({ ...tempSettings, locale: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-GB">DD/MM/YYYY</SelectItem>
                    <SelectItem value="en-US">MM/DD/YYYY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Choose how PropTraka looks and feels.</CardDescription>
            </CardHeader>
            <CardContent>
              <Label>Colour Scheme</Label>
              <RadioGroup
                value={isEditing ? tempSettings.theme : theme}
                onValueChange={(value) => {
                  if (isEditing) {
                    setTempSettings({ ...tempSettings, theme: value as 'light' | 'dark' | 'system' })
                  }
                }}
                className="grid max-w-md grid-cols-3 gap-4 pt-2"
              >
                <Label className="[&:has([data-state=checked])>div]:border-primary cursor-pointer">
                  <RadioGroupItem value="light" className="sr-only" />
                  <div className="flex flex-col items-center justify-center rounded-md border-2 border-muted p-4 hover:border-accent">
                    <Sun className="h-8 w-8" />
                  </div>
                  <span className="block w-full p-2 text-center font-normal">Light</span>
                </Label>
                <Label className="[&:has([data-state=checked])>div]:border-primary cursor-pointer">
                  <RadioGroupItem value="dark" className="sr-only" />
                  <div className="flex flex-col items-center justify-center rounded-md border-2 border-muted p-4 hover:border-accent">
                    <Moon className="h-8 w-8" />
                  </div>
                  <span className="block w-full p-2 text-center font-normal">Dark</span>
                </Label>
                <Label className="[&:has([data-state=checked])>div]:border-primary cursor-pointer">
                  <RadioGroupItem value="system" className="sr-only" />
                  <div className="flex flex-col items-center justify-center rounded-md border-2 border-muted p-4 hover:border-accent">
                    <Laptop className="h-8 w-8" />
                  </div>
                  <span className="block w-full p-2 text-center font-normal">System</span>
                </Label>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Features</CardTitle>
              <CardDescription>Enable or disable AI-powered functionality.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="pnl-switch">AI P&amp;L Statement Generation</Label>
                  <p className="text-xs text-muted-foreground">Allow AI to generate formal Profit & Loss statements.</p>
                </div>
                <Switch id="pnl-switch" checked={tempSettings.isPnlReportEnabled} onCheckedChange={(checked) => setTempSettings({ ...tempSettings, isPnlReportEnabled: checked })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="market-research-switch">AI Market Research Generation</Label>
                  <p className="text-xs text-muted-foreground">Allow AI to generate market analysis reports for your portfolio.</p>
                </div>
                <Switch id="market-research-switch" checked={tempSettings.isMarketResearchEnabled} onCheckedChange={(checked) => setTempSettings({ ...tempSettings, isMarketResearchEnabled: checked })} />
              </div>
            </CardContent>
          </Card>
        </fieldset>

        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Manage your application data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
              <div>
                <h3 className="font-medium text-destructive">Clear Chat History</h3>
                <p className="text-sm text-muted-foreground max-w-md">Permanently delete all conversations with the AI assistant. This action cannot be undone.</p>
              </div>
              <Button variant="destructive" onClick={() => setIsClearChatDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear History
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Sign Out</CardTitle>
            <CardDescription>End your current session on this device.</CardDescription>
          </CardHeader>
          <CardFooter>
            <form action={logout}>
              <Button variant="destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent aria-describedby="password-description">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription id="password-description">
              Enter a new password for your account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleChangePassword)}>
            <div className="py-4">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                {...register('newPassword')}
              />
              {errors.newPassword && (
                <p className="text-sm text-destructive mt-2">{errors.newPassword.message}</p>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isPasswordPending}>
                {isPasswordPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        isOpen={isClearChatDialogOpen}
        onClose={() => setIsClearChatDialogOpen(false)}
        onConfirm={handleClearChatHistory}
        itemName="your entire AI chat history"
        isDestructive={isClearingChat}
      />
    </>
  );
}
