

'use client';

import { useState, useEffect, memo, useTransition } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { ResidencyStatus, KnowledgeArticle } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getAuth, updatePassword } from 'firebase/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, CheckCircle, CreditCard, MoreHorizontal } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/context/theme-context';
import { useDataContext } from '@/context/data-context';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import placeholderFaq from '@/lib/placeholder-faq.json';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { KnowledgeArticleForm } from '@/components/knowledge-article-form';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Skeleton } from '@/components/ui/skeleton';

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

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

function ProfileSettingsTab() {
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
  
  // Temporary state for edits
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
    setTempSettings(settings); // Revert changes
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
}

function SubscriptionBillingTab() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleChoosePlan = (planName: string) => {
    startTransition(async () => {
      // In a real app, this would trigger a payment flow via Pesapal/InstaSend.
      // For now, we simulate success
        toast({
            title: "Subscription Updated",
            description: `You are now on the ${planName}.`,
        });
    });
  }


  return (
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
  );
}

const KnowledgeBaseTab = memo(function KnowledgeBaseTab() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const articlesQuery = useMemo(() => user?.uid ? query(collection(firestore, 'knowledgeBase'), where('ownerId', '==', user.uid)) : null, [firestore, user]);
  const { data: articles, loading: isDataLoading } = useCollection<KnowledgeArticle>(articlesQuery);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);

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


const AccountPage = memo(function AccountPage() {
  return (
    <>
      <PageHeader title="Account" />
      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="profile">Profile & Settings</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="subscription">Subscription & Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="pt-6">
          <ProfileSettingsTab />
        </TabsContent>
         <TabsContent value="knowledge" className="pt-6">
          <KnowledgeBaseTab />
        </TabsContent>
        <TabsContent value="subscription" className="pt-6">
          <SubscriptionBillingTab />
        </TabsContent>
      </Tabs>
    </>
  );
});

export default AccountPage;

    