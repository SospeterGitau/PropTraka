'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Loader2 } from 'lucide-react';

function LoginButton() {
  const auth = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!auth) return;
    setIsLoggingIn(true);
    setError(null);
    try {
      await signInAnonymously(auth);
      // The onAuthStateChanged listener in FirebaseProvider will handle the redirect
    } catch (error) {
      console.error("Anonymous sign-in failed", error);
      setError("Sign-in failed. Please try again.");
      setIsLoggingIn(false);
    }
  };

  return (
    <>
      <Button className="w-full" onClick={handleLogin} disabled={isLoggingIn}>
        {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign In Anonymously
      </Button>
      {error && <p className="text-sm text-center text-destructive mt-2">{error}</p>}
    </>
  );
}

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);
  
  // Show a loading indicator while checking auth state or if user exists
  if (isUserLoading || user) {
     return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
     )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center gap-2">
             <Wallet className="w-8 h-8 text-primary" />
             <h1 className="text-2xl font-semibold font-headline">RentVision</h1>
          </div>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Sign in to manage your property portfolio. All your data will be stored securely and privately.
            </p>
            <LoginButton />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
