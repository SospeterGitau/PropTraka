
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { authenticate } from '@/app/login/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet } from 'lucide-react';

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" aria-disabled={pending}>
      {pending ? 'Logging in...' : 'Login'}
    </Button>
  );
}

export default function LoginPage() {
  const [errorMessage, dispatch] = useFormState(authenticate, undefined);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center gap-2">
             <Wallet className="w-8 h-8 text-primary" />
             <h1 className="text-2xl font-semibold font-headline">RentVision</h1>
          </div>
          <CardTitle>Please sign in to continue</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={dispatch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            
            {errorMessage && (
              <div className="text-sm text-destructive">{errorMessage}</div>
            )}
            
            <LoginButton />
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
