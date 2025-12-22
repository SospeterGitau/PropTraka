'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Upload, AlertTriangle, CheckCircle2, Download } from 'lucide-react';
import { submitTenantApplication } from './actions';
import { tenantApplicationSchema, type TenantApplicationFormData } from '@/lib/schemas/tenant';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { uploadFile } from '@/lib/storage';
import { Progress } from '@/components/ui/progress';

type FormData = TenantApplicationFormData;

export function TenantApplicationForm() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [riskResult, setRiskResult] = useState<any>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const { register, handleSubmit, watch, setValue, formState: { errors }, trigger } = useForm<FormData>({
        resolver: zodResolver(tenantApplicationSchema),
        defaultValues: {
            employmentType: 'Formal',
            gdprConsent: false,
        },
    });

    const employmentType = watch('employmentType');

    const nextStep = async () => {
        let fieldsToValidate: any[] = [];
        if (step === 1) fieldsToValidate = ['fullName', 'idNumber', 'phone', 'email', 'nextOfKinName', 'nextOfKinRelation', 'nextOfKinPhone'];
        if (step === 2) fieldsToValidate = ['employmentType', 'employerName', 'businessNature', 'monthlyIncome'];
        if (step === 3) fieldsToValidate = []; // File upload validation logic if needed

        const isValid = await trigger(fieldsToValidate);
        if (isValid) setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            // call Server Action
            const result = await submitTenantApplication(data);

            if (result.success && result.riskResult) {
                setRiskResult(result.riskResult);
            } else {
                throw new Error(result.error || 'Submission failed');
            }
        } catch (error) {
            console.error(error);
            alert('Error submitting application. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };



    const downloadPDF = async () => {
        const element = document.getElementById('risk-score-card');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('tenant-risk-score.pdf');
        } catch (err) {
            console.error("PDF generation failed", err);
            alert('Failed to generate PDF');
        }
    };

    if (riskResult) {
        return (
            <Card className="w-full max-w-2xl mx-auto shadow-lg border-2 border-primary/10">
                <CardHeader className="text-center bg-primary/5 pb-8 pt-6">
                    <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Application Submitted</CardTitle>
                    <CardDescription>Your tenant risk profile has been generated.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 rounded-xl bg-slate-50 border">
                            <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Risk Score</p>
                            <p className="text-4xl font-bold text-primary">{riskResult.riskScore}/100</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 border">
                            <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Level</p>
                            <p className={`text-2xl font-bold ${riskResult.riskLevel === 'High' ? 'text-red-500' : riskResult.riskLevel === 'Medium' ? 'text-yellow-500' : 'text-green-500'}`}>
                                {riskResult.riskLevel}
                            </p>
                        </div>
                    </div>

                    <Alert variant={riskResult.confidenceScore < 0.8 ? "destructive" : "default"}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Verification Status</AlertTitle>
                        <AlertDescription>
                            {riskResult.verificationWarning || `Confidence Score: ${Math.round(riskResult.confidenceScore * 100)}%`}
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Key Factors:</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            {riskResult.factors.map((f: string, i: number) => <li key={i}>{f}</li>)}
                        </ul>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border">
                        <h4 className="font-semibold text-sm mb-1">Recommendation</h4>
                        <p className="text-sm">{riskResult.recommendation}</p>
                    </div>
                </CardContent>
                <CardFooter className="justify-center pb-8">
                    <Button onClick={() => window.location.reload()}>Submit Another Application</Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Tenant Application</CardTitle>
                <CardDescription>Step {step} of 4: {step === 1 ? 'Personal Details' : step === 2 ? 'Employment' : step === 3 ? 'Financials' : 'Rental History'}</CardDescription>
                <div className="w-full bg-secondary h-2 rounded-full mt-2 overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
                </div>
            </CardHeader>
            <CardContent>
                <form className="space-y-6">
                    {/* STEP 1: PERSONAL */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input {...register('fullName')} placeholder="John Doe" />
                                    {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>ID / Passport Number</Label>
                                    <Input {...register('idNumber')} placeholder="12345678" type="tel" inputMode="numeric" />
                                    {errors.idNumber && <p className="text-xs text-red-500">{errors.idNumber.message}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input {...register('phone')} placeholder="07..." type="tel" />
                                    {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input {...register('email')} placeholder="john@example.com" type="email" />
                                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                                </div>
                            </div>
                            <div className="pt-4 border-t">
                                <h4 className="text-sm font-semibold mb-3">Next of Kin</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input {...register('nextOfKinName')} />
                                        {errors.nextOfKinName && <p className="text-xs text-red-500">{errors.nextOfKinName.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Relation</Label>
                                        <Input {...register('nextOfKinRelation')} placeholder="Brother, Mother..." />
                                        {errors.nextOfKinRelation && <p className="text-xs text-red-500">{errors.nextOfKinRelation.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <Input {...register('nextOfKinPhone')} type="tel" />
                                        {errors.nextOfKinPhone && <p className="text-xs text-red-500">{errors.nextOfKinPhone.message}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: EMPLOYMENT */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Employment Type</Label>
                                <Select onValueChange={(val: any) => setValue('employmentType', val)} defaultValue={employmentType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Formal">Formal Employment (Salaried)</SelectItem>
                                        <SelectItem value="Informal">Informal Sector / Self-Employed</SelectItem>
                                        <SelectItem value="Unemployed">unemployed</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.employmentType && <p className="text-xs text-red-500">{errors.employmentType.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>{employmentType === 'Formal' ? 'Employer Name' : 'Business Name'}</Label>
                                <Input {...register('employerName')} />
                                {errors.employerName && <p className="text-xs text-red-500">{errors.employerName.message}</p>}
                            </div>

                            {employmentType === 'Informal' && (
                                <div className="space-y-2">
                                    <Label>Nature of Business</Label>
                                    <Input {...register('businessNature')} placeholder="e.g. Retail Shop, Freelance..." />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Monthly Income (KES)</Label>
                                <Input type="number" {...register('monthlyIncome')} />
                                {errors.monthlyIncome && <p className="text-xs text-red-500">{errors.monthlyIncome.message}</p>}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: FINANCIALS */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <Alert>
                                <Upload className="h-4 w-4" />
                                <AlertTitle>Verification Required</AlertTitle>
                                <AlertDescription>
                                    To ensure a fair risk score, please upload proof of income. For informal sector, M-Pesa statements are mandatory.
                                </AlertDescription>
                            </Alert>

                            {employmentType === 'Informal' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Avg. Monthly Incoming (M-Pesa)</Label>
                                        <Input type="number" {...register('avgMpesaIncoming')} placeholder="50000" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Avg. Wallet Balance</Label>
                                        <Input type="number" {...register('avgMpesaBalance')} placeholder="5000" />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Upload Statement (PDF)</Label>
                                <div
                                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${fileName ? 'border-green-500 bg-green-50' : 'border-input hover:bg-muted/50'}`}
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                >
                                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${fileName ? 'bg-green-100' : 'bg-muted'}`}>
                                        {fileName ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <Upload className="w-6 h-6 text-muted-foreground" />}
                                    </div>
                                    <p className="text-sm font-medium">{fileName || "Click to upload statement"}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{fileName ? "File selected" : "M-Pesa or Bank Statement (PDF only)"}</p>
                                </div>
                                <Input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".pdf"
                                    onChange={async (e) => {
                                        if (e.target.files?.[0]) {
                                            const file = e.target.files[0];
                                            setFileName(file.name);
                                            setIsUploading(true);
                                            setUploadProgress(0);
                                            try {
                                                const result = await uploadFile(file, 'tenant_uploads', (p) => setUploadProgress(p));
                                                setValue('mpesaStatementUrl', result.url);
                                                setIsUploading(false);
                                            } catch (err) {
                                                console.error(err);
                                                alert('Upload failed');
                                                setIsUploading(false);
                                                setFileName(null);
                                            }
                                        }
                                    }}
                                />
                                {isUploading && <Progress value={uploadProgress} className="h-2 mt-2" />}
                            </div>
                        </div>
                    )}

                    {/* STEP 4: HISTORY */}
                    {step === 4 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Current Landlord Name</Label>
                                    <Input {...register('currentLandlordName')} />
                                    {errors.currentLandlordName && <p className="text-xs text-red-500">{errors.currentLandlordName.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Landlord Phone</Label>
                                    <Input {...register('currentLandlordPhone')} type="tel" />
                                    {errors.currentLandlordPhone && <p className="text-xs text-red-500">{errors.currentLandlordPhone.message}</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Reason for Moving</Label>
                                <Input {...register('reasonForMoving')} />
                                {errors.reasonForMoving && <p className="text-xs text-red-500">{errors.reasonForMoving.message}</p>}
                            </div>

                            <div className="flex items-start space-x-2 pt-4">
                                <Checkbox
                                    id="gdpr"
                                    checked={watch('gdprConsent')}
                                    onCheckedChange={(checked) => setValue('gdprConsent', checked as boolean)}
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <Label htmlFor="gdpr" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        I consent to the collection and processing of my personal data needed for this risk assessment.
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Your data will be processed securely in accordance with the Data Protection Act.
                                    </p>
                                    {errors.gdprConsent && <p className="text-xs text-red-500">{errors.gdprConsent.message}</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </CardContent>
            <CardFooter className="flex justify-between">
                {step > 1 ? (
                    <Button variant="outline" onClick={prevStep}>Previous</Button>
                ) : (
                    <Button variant="ghost" disabled>Previous</Button>
                )}

                {step < 4 ? (
                    <Button onClick={nextStep}>Next Step</Button>
                ) : (
                    <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Application
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
