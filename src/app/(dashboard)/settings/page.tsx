

'use client';

import { useState, useEffect, memo, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { ResidencyStatus, KnowledgeArticle, ChangeLogEntry, SubscriptionPlan, AppFeature, Subscription } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getAuth, updatePassword } from 'firebase/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, CheckCircle, CreditCard, MoreHorizontal, Building2, FileText, HandCoins, Receipt, Wrench, BadgeCheck, Star } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/context/theme-context';
import { useDataContext } from '@/context/data-context';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, addDoc, updateDoc, deleteDoc, doc, writeBatch, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import placeholderFaq from '@/lib/placeholder-faq.json';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { KnowledgeArticleForm } from '@/components/knowledge-article-form';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Timeline, TimelineItem, TimelineConnector, TimelineHeader, TimelineTitle, TimelineIcon, TimelineDescription } from '@/components/ui/timeline';
import { format } from 'date-fns';
import { getLocale } from '@/lib/locales';
import { cn } from '@/lib/utils';
import allPlans from '@/lib/subscription-plans.json';
import allFeatures from '@/lib/app-features.json';
import { Badge } from '@/components/ui/badge';
import { useFitText } from '@/hooks/use-fit-text';


const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

const ProfileSettingsTab = memo(function ProfileSettingsTab() {
  const { theme, setTheme } = useTheme();
  const {
    settings,
    updateSettings,
    isLoading: isDataLoading
  } = useDataContext();

  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const { toast } = useToast();
  
  const [tempSettings, setTempSettings] = useState(settings);

  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);


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
  }, [isEditing, settings]);

  const handleSave = async () => {
    if (tempSettings) {
      await updateSettings(tempSettings);
    }
    setIsEditing(false);
    toast({ title: "Settings Saved", description: "Your preferences have been updated." });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempSettings(settings);
  };

  const handleChangePassword = (data: PasswordFormValues) => {
    startPasswordTransition(async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to change your password.' });
        return;
      }

      try {
        await updatePassword(user, data.newPassword);
        toast({ title: 'Success', description: 'Your password has been updated.' });
        setIsPasswordDialogOpen(false);
        reset();
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
    });
  };

  if (isDataLoading || !tempSettings) {
    return <p>Loading settings...</p>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Profile & Settings</CardTitle>
                <CardDescription>Manage your application settings. Click "Edit" to make changes.</CardDescription>
            </div>
             {!isEditing && (
                <Button onClick={() => setIsEditing(true)}>Edit</Button>
            )}
        </CardHeader>
        <CardContent className="space-y-6">
          <fieldset disabled={!isEditing} className="space-y-8">
            <div>
              <h3 className="text-lg font-medium">Reporting</h3>
               <Separator className="my-2" />
               <div className="space-y-4 pt-2">
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
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Regional</h3>
              <Separator className="my-2" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Appearance</h3>
              <Separator className="my-2" />
               <div className="space-y-2 pt-2">
                <Label>Colour Scheme</Label>
                 <RadioGroup
                    value={theme}
                    onValueChange={(value: "light" | "dark" | "system") => setTheme(value)}
                    className="grid max-w-md grid-cols-3 gap-8 pt-2"
                  >
                    <Label className="[&:has([data-state=checked])>div]:border-primary">
                      <RadioGroupItem value="light" className="sr-only" />
                      <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                        <div className="space-y-2 rounded-sm bg-[#F0F0F0] p-2">
                          <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                            <div className="h-2 w-[80px] rounded-lg bg-[#F0F0F0]" />
                            <div className="h-2 w-[100px] rounded-lg bg-[#F0F0F0]" />
                          </div>
                          <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-[#F0F0F0]" />
                            <div className="h-2 w-[100px] rounded-lg bg-[#F0F0F0]" />
                          </div>
                          <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-[#F0F0F0]" />
                            <div className="h-2 w-[100px] rounded-lg bg-[#F0F0F0]" />
                          </div>
                        </div>
                      </div>
                      <span className="block w-full p-2 text-center font-normal">Light</span>
                    </Label>
                    <Label className="[&:has([data-state=checked])>div]:border-primary">
                      <RadioGroupItem value="dark" className="sr-only" />
                      <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
                        <div className="space-y-2 rounded-sm bg-[#060606] p-2">
                          <div className="space-y-2 rounded-md bg-[#1F1F1F] p-2 shadow-sm">
                            <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                          </div>
                          <div className="flex items-center space-x-2 rounded-md bg-[#1F1F1F] p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-slate-400" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                          </div>
                          <div className="flex items-center space-x-2 rounded-md bg-[#1F1F1F] p-2 shadow-sm">
                            <div className="h-4 w-4 rounded-full bg-slate-400" />
                            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                          </div>
                        </div>
                      </div>
                      <span className="block w-full p-2 text-center font-normal">Dark</span>
                    </Label>
                     <Label className="[&:has([data-state=checked])>div]:border-primary">
                      <RadioGroupItem value="system" className="sr-only" />
                       <div className="items-center rounded-md border-2 border-muted bg-gradient-to-r from-[#060606] to-white p-1 hover:bg-accent hover:text-accent-foreground">
                          <div className="space-y-2 rounded-sm bg-gradient-to-r from-[#121212] to-gray-100 p-2">
                            <div className="space-y-2 rounded-md bg-gradient-to-r from-[#1F1F1F] to-white p-2 shadow-sm">
                              <div className="h-2 w-[80px] rounded-lg bg-gradient-to-r from-slate-400 to-gray-300" />
                              <div className="h-2 w-[100px] rounded-lg bg-gradient-to-r from-slate-400 to-gray-300" />
                            </div>
                            <div className="flex items-center space-x-2 rounded-md bg-gradient-to-r from-[#1F1F1F] to-white p-2 shadow-sm">
                              <div className="h-4 w-4 rounded-full bg-gradient-to-r from-slate-400 to-gray-300" />
                              <div className="h-2 w-[100px] rounded-lg bg-gradient-to-r from-slate-400 to-gray-300" />
                            </div>
                            <div className="flex items-center space-x-2 rounded-md bg-gradient-to-r from-[#1F1F1F] to-white p-2 shadow-sm">
                              <div className="h-4 w-4 rounded-full bg-gradient-to-r from-slate-400 to-gray-300" />
                              <div className="h-2 w-[100px] rounded-lg bg-gradient-to-r from-slate-400 to-gray-300" />
                            </div>
                          </div>
                        </div>
                      <span className="block w-full p-2 text-center font-normal">System</span>
                    </Label>
                  </RadioGroup>
               </div>
            </div>

            <div>
                <h3 className="text-lg font-medium">AI Features</h3>
                <Separator className="my-2" />
                <div className="space-y-4 pt-2">
                    <div className="flex items-center space-x-2">
                        <Switch id="pnl-switch" checked={tempSettings.isPnlReportEnabled} onCheckedChange={(checked) => setTempSettings({...tempSettings, isPnlReportEnabled: checked})} />
                        <Label htmlFor="pnl-switch">Enable AI P&L Statement Generation</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Switch id="market-research-switch" checked={tempSettings.isMarketResearchEnabled} onCheckedChange={(checked) => setTempSettings({...tempSettings, isMarketResearchEnabled: checked})} />
                        <Label htmlFor="market-research-switch">Enable AI Market Research Generation</Label>
                    </div>
                </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Security</h3>
              <Separator className="my-2" />
              <div className="pt-2">
                 <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(true)} disabled={isEditing}>
                    Change Password
                </Button>
              </div>
            </div>

          </fieldset>
          {isEditing && (
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter a new password for your account. You will be logged out after changing it.
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
    </>
  );
});

const PlanPrice = ({ plan }: { plan: SubscriptionPlan }) => {
    const { fontSize, ref } = useFitText();

    return (
        <div ref={ref} className="text-center mb-6 h-12 flex items-center justify-center">
            <span style={{ fontSize }} className="font-bold whitespace-nowrap">
                {plan.price !== null ? `KSh ${plan.price.toLocaleString()}` : 'Custom'}
            </span>
            {plan.price !== null && <span className="text-muted-foreground self-end mb-1">/month</span>}
        </div>
    );
};


const SubscriptionBillingTab = memo(function SubscriptionBillingTab() {
    const { settings, isLoading } = useDataContext();
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const currentPlanName = settings.subscription?.plan;
    const [selectedPlan, setSelectedPlan] = useState<string | null>(currentPlanName || null);
  
    const handleChoosePlan = (planName: string) => {
        if(planName === currentPlanName) return;

        startTransition(async () => {
          toast({
              title: "Confirm Subscription",
              description: `This is where you would integrate with IntaSend to change the plan to ${planName}.`,
          });
          // In a real app, you would navigate to a checkout page or call an API here.
          // For now, we just show the toast.
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                {allPlans.map((plan) => {
                    const isCurrent = plan.name === currentPlanName;
                    const isSelected = plan.name === selectedPlan;
                    const isMostPopular = plan.name === 'Professional';
                    const planFeatures = plan.features.map(fid => allFeatures.find(f => f.id === fid)).filter(Boolean) as AppFeature[];

                    return (
                        <div key={plan.id} className="h-full">
                             <button
                                onClick={() => handleSelectPlan(plan.name)}
                                disabled={isCurrent}
                                className={cn(
                                    "relative rounded-2xl border p-6 shadow-sm flex flex-col h-full w-full text-left transition-all duration-200",
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

                            <div className="flex-1">
                                <CardHeader className="text-center p-0 mb-6">
                                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground pt-1 h-10">{plan.description}</p>
                                </CardHeader>
                                
                                <PlanPrice plan={plan} />
                                
                                <Separator />

                                <CardContent className="p-0 mt-6">
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
                                    onClick={() => handleChoosePlan(plan.name)}
                                    disabled={isPending || isCurrent}
                                >
                                    {isPending && isSelected ? <Loader2 className="h-4 w-4 animate-spin" /> : (isCurrent ? 'Your Plan' : 'Choose Plan')}
                                </Button>
                            </div>
                        </button>
                        </div>
                    );
                })}
            </div>
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

    const articlesQuery = useMemo(() => user?.uid ? query(collection(firestore, 'knowledgeBase'), where('ownerId', '==', user.uid)) : null, [firestore, user?.uid]);
    const { data: articles, loading: isDataLoading } = useCollection<KnowledgeArticle>(articlesQuery);

    const articlesToDisplay = (articles && articles.length > 0) ? articles : placeholderFaq;

    const handleSeedData = async () => {
        if (!user) return;
        const batch = writeBatch(firestore);
        placeholderFaq.forEach(article => {
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
            <CardDescription><Skeleton className="h-4 w-3/4" /></CardDescription>
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
                  <TableRow key={article.id || `placeholder-${index}`}>
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
                          <DropdownMenuItem onSelect={() => handleEdit(article)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDelete(article)}>Delete</DropdownMenuItem>
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

const ChangelogTab = memo(function ChangelogTab() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { settings } = useDataContext();
  const { locale } = settings;

  const changelogQuery = useMemo(() => user?.uid ? query(collection(firestore, 'changelog'), where('ownerId', '==', user.uid), orderBy('date', 'desc')) : null, [firestore, user]);
  const { data: changelog, loading: isDataLoading } = useCollection<ChangeLogEntry>(changelogQuery);

  const [formattedDates, setFormattedDates] = useState<{[key: string]: string}>({});

  const iconMap: { [key: string]: React.ReactNode } = {
      Property: <Building2 className="h-4 w-4" />,
      Tenancy: <FileText className="h-4 w-4" />,
      Expense: <Receipt className="h-4 w-4" />,
      Payment: <HandCoins className="h-4 w-4" />,
      Maintenance: <Wrench className="h-4 w-4" />,
      Contractor: <Wrench className="h-4 w-4" />,
      Subscription: <CreditCard className="h-4 w-4" />,
  };

  useEffect(() => {
    const formatAllDates = async () => {
        if (!changelog) return;
        const localeData = await getLocale(locale);
        const newFormattedDates: {[key: string]: string} = {};
        for (const item of changelog) {
            newFormattedDates[item.id] = format(new Date(item.date), 'MMMM dd, yyyy, HH:mm', { locale: localeData });
        }
        setFormattedDates(newFormattedDates);
    };
    formatAllDates();
  }, [changelog, locale]);
  
  if (isDataLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle>
                <CardDescription><Skeleton className="h-4 w-3/4" /></CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
          <CardDescription>A log of all significant events and changes within your portfolio.</CardDescription>
      </CardHeader>
      <CardContent>
          {changelog && changelog.length > 0 ? (
          <Timeline>
              {changelog.map((item, index) => (
                  <TimelineItem key={item.id}>
                      {index < changelog.length - 1 && <TimelineConnector />}
                      <TimelineHeader>
                          <TimelineIcon>{iconMap[item.type]}</TimelineIcon>
                          <TimelineTitle>{item.type} {item.action}</TimelineTitle>
                          <div className="text-sm text-muted-foreground ml-auto">{formattedDates[item.id]}</div>
                      </TimelineHeader>
                      <TimelineDescription>
                          {item.description}
                      </TimelineDescription>
                  </TimelineItem>
              ))}
          </Timeline>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No activity recorded yet.
            </div>
          )}
      </CardContent>
    </Card>
  );
});


export default function AccountPage() {
  return (
    <>
      <PageHeader title="Account" />
      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="profile">Profile &amp; Settings</TabsTrigger>
          <TabsTrigger value="subscription">Subscription &amp; Billing</TabsTrigger>
          <TabsTrigger value="changelog">Changelog</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="pt-6">
          <ProfileSettingsTab />
        </TabsContent>
        <TabsContent value="subscription" className="pt-6">
          <SubscriptionBillingTab />
        </TabsContent>
        <TabsContent value="changelog" className="pt-6">
          <ChangelogTab />
        </TabsContent>
        <TabsContent value="knowledge" className="pt-6">
          <KnowledgeBaseTab />
        </TabsContent>
      </Tabs>
    </>
  );
}


    