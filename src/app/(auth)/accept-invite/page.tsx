'use client';

import { useEffect, useState, Suspense } from 'react'; // Added Suspense
import { useSearchParams, useRouter } from 'next/navigation';
import { validateInvitation, acceptInvitation } from '@/app/actions/invitations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Component that uses useSearchParams
function AcceptInviteContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [isValid, setIsValid] = useState(false);
    const [error, setError] = useState('');
    const [inviteData, setInviteData] = useState<{ email: string; name: string } | null>(null);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Missing invitation token.');
            setIsLoading(false);
            return;
        }

        const checkToken = async () => {
            const result = await validateInvitation(token);
            if (result.valid && result.data) {
                setInviteData(result.data);
                setIsValid(true);
            } else {
                setError(result.message || 'Invalid invitation.');
            }
            setIsLoading(false);
        };

        checkToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setIsSubmitting(true);
        setError('');

        if (!token) return;

        const result = await acceptInvitation(token, password);

        if (result.success) {
            // Redirect to login or dashboard
            router.push('/signin?invited=true');
        } else {
            setError(result.message || "Failed to create account");
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error && !inviteData) { // Show error only if we couldn't even load data
        return (
            <Card className="w-full max-w-md mx-auto mt-20">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Invitation Error
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{error}</p>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" onClick={() => router.push('/')} className="w-full">Go Home</Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto mt-20">
            <CardHeader>
                <CardTitle>Welcome, {inviteData?.name}!</CardTitle>
                <CardDescription>
                    Set up your password to access your tenant portal for <strong>{inviteData?.email}</strong>.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="password">Create Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Account...
                            </>
                        ) : (
                            'Create Account & Login'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

// Main Page Component wrapped in Suspense
export default function AcceptInvitePage() {
    return (
        <div className="min-h-screen bg-gray-50 px-4">
            <Suspense fallback={
                <div className="flex justify-center items-center h-screen">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }>
                <AcceptInviteContent />
            </Suspense>
        </div>
    );
}
