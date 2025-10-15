'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Loader2 } from 'lucide-react';

function LoginButton() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleLogin = async () => {
    if (!auth) return;
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Anonymous sign-in failed", error);
    }
  };

  if (isUserLoading || user) {
    return (
        <Button className="w-full" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redirecting...
        </Button>
    );
  }

  return (
    <Button className="w-full" onClick={handleLogin}>
      Sign In Anonymously
    </Button>
  );
}

export default function LoginPage() {
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
