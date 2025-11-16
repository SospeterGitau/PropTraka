
'use client';

import { useTransition, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createSession } from '@/app/login/actions';
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
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons';


const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function SignInPage() {
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
        await signInWithEmailAndPassword(auth, data.email, data.password);
        // Session creation and redirect will be handled by the auth state listener
        await createSession();
      } catch (signInError: any) {
         if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/wrong-password' || signInError.code === 'auth/invalid-credential') {
          toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'The email or password you entered is incorrect.',
          });
        } else {
           toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: signInError.message,
          });
        }
      }
    });
  };

  const handleGoogleSignIn = () => {
     startTransition(async () => {
        const auth = getAuth();
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            // On successful sign-in, the onAuthStateChanged listener will trigger
            // the session creation and redirect.
            await createSession();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Google Sign-In Failed",
                description: error.message,
            });
        }
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center p-6 space-y-2">
        <CardTitle className="text-2xl">Welcome to LeaseLync</CardTitle>
        <CardDescription>Enter your credentials to sign in or create an account.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
            <h3 className="font-bold text-center">Log In</h3>
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
                <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                    href="/forgot-password"
                    className="h-auto p-0 text-xs text-primary underline-offset-4 hover:underline"
                >
                    Forgot Password?
                </Link>
                </div>
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

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                    </span>
                </div>
            </div>

            <SocialAuthButtons 
                onGoogleSignIn={handleGoogleSignIn} 
                isPending={isPending}
            />

             <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                    href="/signup"
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                    Sign up
                </Link>
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
