import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/index';

export default function TenantLoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            alert('Please enter your email and password');
            return;
        }

        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Create session cookie via server action (security best practice)
            // For now, client-side auth state listener will handle access, but we should sync.
            // Relying on onAuthStateChanged in layout/middleware protection.
            // Given middleware relies on "session" (Iron Session), we need to create it!
            // Check src/app/actions.ts -> createSession

            // Dynamic import to avoid circular dep or client/server confusion if needed, 
            // but let's assume we can call the action.
            // Actually, we need to import createSession from '@/app/actions';
            const { createSession } = await import('@/app/actions');
            await createSession(auth.currentUser?.uid || 'user', false);

            router.push('/portal');
        } catch (error: any) {
            console.error('Login error:', error);
            alert('Login failed: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Tenant Portal</CardTitle>
                    <CardDescription>Sign in to manage your tenancy</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Email</label>
                        <Input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Password</label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Sign In
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                        Not a tenant? <Link href="/signin" className="underline hover:text-primary">Landlord Login</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
