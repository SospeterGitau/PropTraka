

'use client';

import { useState, useEffect, memo, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { ResidencyStatus, KnowledgeArticle, ChangeLogEntry, SubscriptionPlan, AppFeature, Subscription, ApiKey } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getAuth, updatePassword, updateProfile, updateEmail } from 'firebase/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, CheckCircle, CreditCard, MoreHorizontal, Building2, FileText, HandCoins, Receipt, Wrench, BadgeCheck, Star, Trash2, LogOut, Sun, Moon, Laptop, User as UserIcon, Copy } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/context/theme-context';
import { useDataContext } from '@/context/data-context';
import { useUser, useFirestore } from '@/firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch, Query, getDocs, where, query, serverTimestamp, setDoc } from 'firebase/firestore';
import placeholderFaq from '@/lib/placeholder-faq.json';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KnowledgeArticleForm } from '@/components/knowledge-article-form';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import allPlans from '@/lib/subscription-plans.json';
import allFeatures from '@/lib/app-features.json';
import { Badge } from '@/components/ui/badge';
import { createUserQuery } from '@/firebase/firestore/query-builder';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { logout } from '@/app/actions';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';


const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

const ProfileSettingsTab = memo(function ProfileSettingsTab() {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const { firestore } = useUser();
  const {
    settings,
    updateSettings,
    isLoading: isDataLoading
  } = useDataContext();

  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const { toast } = useToast();
  
  // States for user profile fields
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');

  const [tempSettings, setTempSettings] = useState(settings);
  const [originalSettings, setOriginalSettings] = useState(settings);

  const [isClearingChat, setIsClearingChat] = useState(false);
  const [isClearChatDialogOpen, setIsClearChatDialogOpen] = useState(false);

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
            
            await updateSettings(tempSettings);
            if (tempSettings.theme) {
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
    if (!isEditing) return;

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let effectiveTheme = tempSettings.theme || 'system';
    if (effectiveTheme === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.classList.add(effectiveTheme);
    
    return () => {
      // On cleanup, revert to the originally saved global theme
      const globalTheme = settings.theme || 'system';
      let effectiveGlobalTheme = globalTheme;
      if (effectiveGlobalTheme === 'system') {
        effectiveGlobalTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      root.classList.remove('light', 'dark');
      root.classList.add(effectiveGlobalTheme);
    }
  }, [isEditing, tempSettings.theme, settings.theme]);


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
        
        if(snapshot.empty) {
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
    } catch(error) {
         toast({ variant: 'destructive', title: 'Error', description: 'Could not clear chat history. Please try again.' });
    } finally {
        setIsClearChatDialogOpen(false);
        setIsClearingChat(false);
    }
  }

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
                            <Select name="role" value={tempSettings.role} onValueChange={(v) => setTempSettings({...tempSettings, role: v})}>
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
                            <Select name="portfolioSize" value={tempSettings.portfolioSize} onValueChange={(v) => setTempSettings({...tempSettings, portfolioSize: v})}>
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
                        <Input id="areasOfInterest" value={(tempSettings.areasOfInterest || []).join(', ')} onChange={(e) => setTempSettings({...tempSettings, areasOfInterest: e.target.value.split(',').map(s => s.trim())})} placeholder="e.g. Kilimani, Nyali, Nakuru Town" />
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
                            <Input id="billingAddressLine1" value={tempSettings.billingAddressLine1 || ''} onChange={(e) => setTempSettings({...tempSettings, billingAddressLine1: e.target.value})} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="billingAddressLine2">Address Line 2 (or P.O. Box)</Label>
                            <Input id="billingAddressLine2" value={tempSettings.billingAddressLine2 || ''} onChange={(e) => setTempSettings({...tempSettings, billingAddressLine2: e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="billingCity">City</Label>
                            <Input id="billingCity" value={tempSettings.billingCity || ''} onChange={(e) => setTempSettings({...tempSettings, billingCity: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="billingCounty">County</Label>
                            <Input id="billingCounty" value={tempSettings.billingCounty || ''} onChange={(e) => setTempSettings({...tempSettings, billingCounty: e.target.value})} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="billingPostalCode">Postal / Area Code</Label>
                            <Input id="billingPostalCode" value={tempSettings.billingPostalCode || ''} onChange={(e) => setTempSettings({...tempSettings, billingPostalCode: e.target.value})} />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="billingCountry">Country</Label>
                            <Input id="billingCountry" value={tempSettings.billingCountry || ''} onChange={(e) => setTempSettings({...tempSettings, billingCountry: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="vatPin">VAT / KRA PIN (Optional)</Label>
                            <Input id="vatPin" value={tempSettings.vatPin || ''} onChange={(e) => setTempSettings({...tempSettings, vatPin: e.target.value})} />
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
                    <div className="space-y-2">
                        <Label htmlFor="templateTenancyAgreementUrl">Tenancy Agreement Template URL</Label>
                        <Input id="templateTenancyAgreementUrl" value={tempSettings.templateTenancyAgreementUrl || ''} onChange={(e) => setTempSettings({...tempSettings, templateTenancyAgreementUrl: e.target.value})} placeholder="https://docs.google.com/document/..." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="templateApplicationFormUrl">Application Form Template URL</Label>
                        <Input id="templateApplicationFormUrl" value={tempSettings.templateApplicationFormUrl || ''} onChange={(e) => setTempSettings({...tempSettings, templateApplicationFormUrl: e.target.value})} placeholder="https://docs.google.com/document/..." />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="templateLandlordAssessmentFormUrl">Landlord Assessment Form URL</Label>
                        <Input id="templateLandlordAssessmentFormUrl" value={tempSettings.templateLandlordAssessmentFormUrl || ''} onChange={(e) => setTempSettings({...tempSettings, templateLandlordAssessmentFormUrl: e.target.value})} placeholder="https://docs.google.com/document/..." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="templateMoveInChecklistUrl">Move-in Checklist Template URL</Label>
                        <Input id="templateMoveInChecklistUrl" value={tempSettings.templateMoveInChecklistUrl || ''} onChange={(e) => setTempSettings({...tempSettings, templateMoveInChecklistUrl: e.target.value})} placeholder="https://docs.google.com/document/..." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="templateMoveOutChecklistUrl">Move-out Checklist Template URL</Label>
                        <Input id="templateMoveOutChecklistUrl" value={tempSettings.templateMoveOutChecklistUrl || ''} onChange={(e) => setTempSettings({...tempSettings, templateMoveOutChecklistUrl: e.target.value})} placeholder="https://docs.google.com/document/..." />
                    </div>
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
                  <Input value={tempSettings.companyName} onChange={(e) => setTempSettings({...tempSettings, companyName: e.target.value})} placeholder="Your Company Ltd." />
                </div>
                <div className="space-y-2">
                  <Label>Residency Status (for Tax Calculation)</Label>
                  <RadioGroup value={tempSettings.residencyStatus} onValueChange={(v) => setTempSettings({...tempSettings, residencyStatus: v as ResidencyStatus})} className="flex gap-4 pt-2">
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
                  <Select value={tempSettings.currency} onValueChange={(v) => setTempSettings({...tempSettings, currency: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
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
                  <Select value={tempSettings.locale} onValueChange={(v) => setTempSettings({...tempSettings, locale: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
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
                          setTempSettings({...tempSettings, theme: value as 'light' | 'dark' | 'system'})
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
                      <Switch id="pnl-switch" checked={tempSettings.isPnlReportEnabled} onCheckedChange={(checked) => setTempSettings({...tempSettings, isPnlReportEnabled: checked})} />
                  </div>
                   <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                         <Label htmlFor="market-research-switch">AI Market Research Generation</Label>
                          <p className="text-xs text-muted-foreground">Allow AI to generate market analysis reports for your portfolio.</p>
                      </div>
                      <Switch id="market-research-switch" checked={tempSettings.isMarketResearchEnabled} onCheckedChange={(checked) => setTempSettings({...tempSettings, isMarketResearchEnabled: checked})} />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
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
});

const PlanPrice = ({ plan, billingCycle }: { plan: SubscriptionPlan, billingCycle: 'monthly' | 'yearly' }) => {
    const price = billingCycle === 'yearly'
        ? plan.price !== null ? plan.price * 12 * 0.85 : null // 15% discount for yearly
        : plan.price;

    return (
        <div className="flex items-baseline justify-center gap-1 my-6">
            {price !== null ? (
                <>
                    <span className="text-muted-foreground text-2xl">KSh</span>
                    <span className="text-4xl font-bold tracking-tight">{(price).toLocaleString()}</span>
                    <span className="text-muted-foreground">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                </>
            ) : (
                <span className="text-4xl font-bold tracking-tight">Custom</span>
            )}
        </div>
    );
};


const SubscriptionBillingTab = memo(function SubscriptionBillingTab() {
    const { settings, isLoading } = useDataContext();
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    
    const currentPlanName = settings.subscription?.plan;
    const [selectedPlan, setSelectedPlan] = useState<string | null>(currentPlanName || null);
  
    const handleChoosePlan = (e: React.MouseEvent, planName: string) => {
        e.stopPropagation(); // Prevent the card's onClick from firing
        if(planName === currentPlanName) return;

        startTransition(async () => {
          toast({
              title: "Confirm Subscription",
              description: `This is where you would integrate with IntaSend to change the plan to ${planName}.`,
          });
        });
    }

    const handleSelectPlan = (planName: string) => {
        if (planName !== currentPlanName) {
            setSelectedPlan(planName);
        }
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 items-start">
                {allPlans.map((plan) => {
                    const isCurrent = plan.name === currentPlanName;
                    const isSelected = plan.name === selectedPlan;
                    const isMostPopular = plan.name === 'Professional';
                    const planFeatures = plan.features.map(fid => allFeatures.find(f => f.id === fid)).filter(Boolean) as AppFeature[];

                    return (
                        <div key={plan.id} className="h-full">
                             <div
                                onClick={() => handleSelectPlan(plan.name)}
                                className={cn(
                                    "relative rounded-2xl border p-6 shadow-sm flex flex-col h-full w-full text-left transition-all duration-200 cursor-pointer",
                                    isCurrent ? "ring-2 ring-primary bg-card" : "hover:shadow-lg",
                                    isSelected && !isCurrent ? "ring-2 ring-primary" : "border-border",
                                    isMostPopular && !isCurrent && "bg-muted/30"
                                )}
                            >
                            {isMostPopular && (
                                <Badge variant="secondary" className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 font-semibold">
                                    <Star className="mr-2 h-4 w-4 fill-yellow-400 text-yellow-500" />
                                    Most Popular
                                </Badge>
                            )}
                             {isCurrent && (
                                <Badge variant="default" className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                                    Current Plan
                                </Badge>
                            )}

                            <div className="flex-1 flex flex-col">
                                <CardHeader className="text-center p-0">
                                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground pt-1 min-h-[40px]">{plan.description}</p>
                                </CardHeader>
                                
                                <PlanPrice plan={plan as SubscriptionPlan} billingCycle={billingCycle} />
                                
                                <Separator />

                                <CardContent className="p-0 mt-6 flex-1">
                                    <h4 className="font-semibold text-center mb-4">Features</h4>
                                    <ul className="space-y-3 text-sm">
                                        {planFeatures.map((feature) => (
                                            <li key={feature.id} className="flex items-center gap-3">
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                                {feature.page_url ? (
                                                    <Link href={feature.page_url} className="hover:underline">{feature.name}</Link>
                                                ) : (
                                                    <span>{feature.name}</span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </div>

                            <div className="mt-6">
                                <Button
                                    className="w-full"
                                    variant={isCurrent ? 'secondary' : (isMostPopular ? 'default' : 'outline')}
                                    onClick={(e) => handleChoosePlan(e, plan.name)}
                                    disabled={isPending || isCurrent}
                                >
                                    {isPending && isSelected ? <Loader2 className="h-4 w-4 animate-spin" /> : (isCurrent ? 'Your Plan' : 'Choose Plan')}
                                </Button>
                            </div>
                        </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

const ApiAccessTab = memo(function ApiAccessTab() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const apiKeysQuery = useMemo(() => user?.uid ? createUserQuery(firestore, 'apiKeys', user.uid) : null, [firestore, user?.uid]);
    const [apiKeysSnapshot, isKeysLoading] = useCollection(apiKeysQuery as Query<ApiKey> | null);
    const apiKeys = useMemo(() => apiKeysSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as ApiKey)) || [], [apiKeysSnapshot]);

    const [isGenerating, setIsGenerating] = useState(false);
    const [newKey, setNewKey] = useState<string | null>(null);

    const handleGenerateKey = async () => {
        if (!user || !firestore) return;
        setIsGenerating(true);
        setNewKey(null);

        try {
            // In a real app, this would be a call to a secure cloud function
            // that generates a cryptographically secure random string.
            // For this demo, we'll create a simple, readable one.
            const key = `proptraka_dev_${user.uid.slice(0, 5)}_${Date.now()}`;
            const keyDocRef = doc(firestore, 'apiKeys', key);
            
            await setDoc(keyDocRef, {
                ownerId: user.uid,
                createdAt: serverTimestamp(),
            });

            setNewKey(key);
            toast({
                title: "API Key Generated",
                description: "Your new API key has been created successfully.",
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not generate API key.' });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: "API key copied to clipboard." });
    };

    if (isKeysLoading) {
        return <Skeleton className="h-48 w-full" />;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>API Access</CardTitle>
                    <CardDescription>Manage API keys for programmatic access to your data.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertTitle>API Endpoint</AlertTitle>
                        <AlertDescription>
                            Your base API endpoint is: <code className="font-mono bg-muted p-1 rounded-sm">/api/v1</code>
                        </AlertDescription>
                    </Alert>
                </CardContent>
                <CardFooter className="flex-col items-start gap-4">
                     <div className="flex items-center justify-between w-full">
                        <div>
                            <h3 className="font-medium">Generate New Key</h3>
                            <p className="text-sm text-muted-foreground">Create a new key to use with the API.</p>
                        </div>
                        <Button onClick={handleGenerateKey} disabled={isGenerating}>
                            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Generate Key
                        </Button>
                    </div>
                    {newKey && (
                        <Alert variant="default" className="w-full flex items-center justify-between">
                            <div>
                                <AlertTitle>New Key Generated!</AlertTitle>
                                <AlertDescription className="break-all font-mono text-sm">{newKey}</AlertDescription>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(newKey)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </Alert>
                    )}
                </CardFooter>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Your API Keys</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>API Key (Hashed)</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Last Used</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {apiKeys.length > 0 ? (
                                apiKeys.map(key => (
                                    <TableRow key={key.id}>
                                        <TableCell className="font-mono">...{key.id.slice(-8)}</TableCell>
                                        <TableCell>{key.createdAt ? format(key.createdAt.toDate(), 'PP, p') : 'N/A'}</TableCell>
                                        <TableCell>{key.lastUsed ? format(key.lastUsed.toDate(), 'PP, p') : 'Never'}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">
                                        No API keys have been generated yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
        </div>
    );
});


const KnowledgeBaseTab = memo(function KnowledgeBaseTab() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);

    const articlesQuery = useMemo(() => user?.uid ? createUserQuery(firestore, 'knowledgeBase', user.uid) : null, [firestore, user?.uid]);
    const [articlesSnapshot, isDataLoading] = useCollection(articlesQuery);
    const articles = useMemo(() => articlesSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as KnowledgeArticle)) || [], [articlesSnapshot]);


    const articlesToDisplay = (articles && articles.length > 0) ? articles : placeholderFaq.flatMap(cat => cat.questions.map(q => ({ id: '', ...q })));


    const handleSeedData = async () => {
        if (!user) return;
        const batch = writeBatch(firestore);
        placeholderFaq.flatMap(cat => cat.questions).forEach(article => {
            const docRef = doc(collection(firestore, 'knowledgeBase'));
            batch.set(docRef, { ...article, ownerId: user.uid });
        });
        await batch.commit();
        toast({
            title: "Knowledge Base Seeded",
            description: "The placeholder FAQs have been added to your knowledge base.",
        });
    };

    const handleAdd = () => {
        setSelectedArticle(null);
        setIsFormOpen(true);
    };

    const handleEdit = (article: KnowledgeArticle) => {
        setSelectedArticle(article);
        setIsFormOpen(true);
    };

    const handleDelete = (article: KnowledgeArticle) => {
        setSelectedArticle(article);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedArticle) {
            if (!articles?.find(a => a.id === selectedArticle.id)) {
                toast({ variant: 'destructive', title: 'Error', description: 'Cannot delete a placeholder article. Seed the data first.' });
                setIsDeleteDialogOpen(false);
                return;
            }
            await deleteDoc(doc(firestore, 'knowledgeBase', selectedArticle.id));
            setIsDeleteDialogOpen(false);
            setSelectedArticle(null);
        }
    };

    const handleFormSubmit = async (data: Omit<KnowledgeArticle, 'id' | 'ownerId'> | KnowledgeArticle) => {
        if (!user) return;
        const isEditing = 'id' in data;

        if (isEditing) {
            if (!articles?.find(a => a.id === data.id)) {
                toast({ variant: 'destructive', title: 'Error', description: 'Cannot edit a placeholder article. Seed the data first.' });
                setIsFormOpen(false);
                return;
            }
            await updateDoc(doc(firestore, 'knowledgeBase', data.id), data as Partial<KnowledgeArticle>);
        } else {
            await addDoc(collection(firestore, 'knowledgeBase'), { ...data, ownerId: user.uid });
        }
        setIsFormOpen(false);
    };
  
  if (isDataLoading) {
    return (
        <Card>
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle>
            <CardDescription asChild>
                <div className="text-sm text-muted-foreground pt-1">
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>AI Knowledge Base</CardTitle>
            <CardDescription>
              This is the "brain" of the help system. Add FAQs and guides here.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {articles && articles.length === 0 && (
                <Button onClick={handleSeedData}>Seed with Placeholder FAQs</Button>
            )}
            <Button onClick={handleAdd}>Add Article</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title / Question</TableHead>
                <TableHead>Content / Answer</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articlesToDisplay.length > 0 ? (
                articlesToDisplay.map((article, index) => (
                  <TableRow key={(article as KnowledgeArticle).id || `placeholder-${index}`}>
                    <TableCell className="font-medium">{article.title}</TableCell>
                    <TableCell className="max-w-md truncate">{article.content}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleEdit(article as KnowledgeArticle)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDelete(article as KnowledgeArticle)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No articles found. Add your first article to teach the AI.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <KnowledgeArticleForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        article={selectedArticle}
      />
      
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        itemName={`the article titled: "${selectedArticle?.title}"`}
      />
    </>
  );
});

const SettingsTabs = () => {
    const { settings, isLoading } = useDataContext();
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isLoading) {
        return (
            <div className="mb-6">
                <Skeleton className="h-10 w-full max-w-lg" />
            </div>
        );
    }
    
    // In development: show to all users for testing
    // In production: only show to Enterprise users
    const isEnterprise = isDevelopment || settings?.subscription?.plan === 'Enterprise';

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
