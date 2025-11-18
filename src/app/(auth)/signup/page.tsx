
'use client';

import { useTransition, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createSession } from '@/app/actions';
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
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignUpPage() {
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, setIsGooglePending] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = (data: SignupFormValues) => {
    startTransition(async () => {
      const auth = getAuth();
      try {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
        toast({
            title: "Account Created",
            description: "Welcome! Your new account has been successfully created.",
        });
        await createSession();
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            toast({
                variant: "destructive",
                title: "Sign Up Failed",
                description: "An account with this email address already exists.",
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Sign Up Error',
                description: error.message,
            });
        }
      }
    });
  };

  const handleGoogleSignIn = async () => {
    setIsGooglePending(true);
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        await createSession();
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Google Sign-In Failed",
            description: error.message,
        });
    } finally {
        setIsGooglePending(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center p-6 space-y-2">
        <CardTitle className="text-2xl">Welcome to LeaseLync</CardTitle>
        <CardDescription>Create your account to get started.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
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
                'Create Account'
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
                isPending={isGooglePending}
            />

             <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                    href="/signin"
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                    Sign in
                </Link>
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
