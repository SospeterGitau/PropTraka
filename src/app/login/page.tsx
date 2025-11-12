
'use client';

import { useTransition, useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';


const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const passwordResetSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;


function LoginPageContent() {
  const [isPending, startTransition] = useTransition();
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
        await signInWithEmailAndPassword(auth, data.email, data.password);
      } catch (signInError: any) {
        if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
          try {
            await createUserWithEmailAndPassword(auth, data.email, data.password);
             toast({
              title: "Account Created",
              description: "Welcome! Your new account has been successfully created.",
            });
          } catch (signUpError: any) {
            toast({
              variant: 'destructive',
              title: 'Sign Up Error',
              description: signUpError.message,
            });
          }
        } else {
          toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: signInError.message,
          });
        }
      } finally {
        await login();
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

  return (
    <>
    <div className="flex h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center p-6">
          <CardTitle className="text-2xl">Welcome to LeaseLync</CardTitle>
          <CardDescription>Enter your credentials to sign in or create an account.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
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
                'Login or Sign Up'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>

    <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
            <DialogDescription>
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

export default function LoginPage() {
  return (
    <FirebaseClientProvider>
      <LoginPageContent />
    </FirebaseClientProvider>
  )
}
