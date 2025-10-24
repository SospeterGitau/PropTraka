'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';


const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginPageContent() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
        email: 'sospeter.gitau@gmail.com',
    }
  });

  const onSubmit = (data: LoginFormValues) => {
    startTransition(async () => {
      const auth = getAuth();
      try {
        // Try to sign in first
        await signInWithEmailAndPassword(auth, data.email, data.password);
        // If successful, the onAuthStateChanged listener in the layout will handle the redirect.
        
      } catch (signInError: any) {
        // If sign-in fails because the user doesn't exist, try to create a new account.
        if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
          try {
            await createUserWithEmailAndPassword(auth, data.email, data.password);
            // New user created, onAuthStateChanged will handle the redirect.
          } catch (signUpError: any) {
            // Handle specific sign-up errors
            toast({
              variant: 'destructive',
              title: 'Sign Up Error',
              description: signUpError.message,
            });
          }
        } else {
          // Handle other sign-in errors (like wrong password)
          toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: signInError.message,
          });
        }
      } finally {
        // After either sign-in or sign-up, create a server-side session.
        // The redirect is now handled by the useUser hook in the layout.
        await login();
      }
    });
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </>
              ) : (
                'Login or Sign Up'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <FirebaseClientProvider>
      <LoginPageContent />
    </FirebaseClientProvider>
  )
}
