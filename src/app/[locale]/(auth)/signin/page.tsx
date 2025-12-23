
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
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';


const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const passwordResetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;


export default function SignInPage() {
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, setIsGooglePending] = useState(false);
  const [isResetPending, startResetTransition] = useTransition();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
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

  const passwordResetForm = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    startTransition(async () => {
      const auth = getAuth();
      try {
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        // Session creation and redirect will be handled by the auth state listener
        await createSession(userCredential.user.uid);
      } catch (signInError: any) {
        // Ignore NEXT_REDIRECT - it's not an error, just Next.js redirecting
        if (signInError.message?.includes('NEXT_REDIRECT')) {
          return; // Let the redirect happen without showing error
        }

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

  const handlePasswordReset = (data: PasswordResetFormValues) => {
    startResetTransition(async () => {
      const auth = getAuth();
      try {
        await sendPasswordResetEmail(auth, data.email);
        toast({
          title: "Password Reset Email Sent",
          description: `If an account exists for ${data.email}, you will receive an email with instructions.`,
        });
        setIsResetDialogOpen(false);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message,
        });
      }
    });
  };

  const handleGoogleSignIn = async () => {
    setIsGooglePending(true);
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await createSession(result.user.uid);
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
    <>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center p-6 space-y-2">
          <CardTitle className="text-2xl">Welcome to PropTraka</CardTitle>
          <CardDescription>Sign in to access your rental portfolio dashboard.</CardDescription>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs"
                    onClick={() => setIsResetDialogOpen(true)}
                  >
                    Forgot Password?
                  </Button>
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
                  'Sign In'
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

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent aria-describedby="reset-description">
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
            <DialogDescription id="reset-description">
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={passwordResetForm.handleSubmit(handlePasswordReset)}>
            <div className="py-4">
              <Label htmlFor="reset-email">Email Address</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="m@example.com"
                {...passwordResetForm.register('email')}
              />
              {passwordResetForm.formState.errors.email && (
                <p className="text-sm text-destructive mt-2">{passwordResetForm.formState.errors.email.message}</p>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isResetPending}>
                {isResetPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
