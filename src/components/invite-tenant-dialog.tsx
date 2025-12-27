'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createInvitation } from '@/app/actions/invitations';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { Tenant } from '@/lib/db-types';
import { useToast } from '@/hooks/use-toast';

interface InviteTenantDialogProps {
    tenant: Tenant;
    trigger?: React.ReactNode;
}

export function InviteTenantDialog({ tenant, trigger }: InviteTenantDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const { toast } = useToast();

    const handleInvite = async () => {
        if (!tenant.id) return;

        setIsLoading(true);
        try {
            const result = await createInvitation(tenant.id);
            if (result.success) {
                setIsSent(true);
                toast({
                    title: "Invitation Sent",
                    description: `An invitation has been sent to ${tenant.email}.`,
                });
                // Close after a generic delay or keep open to show success state
                setTimeout(() => {
                    setIsOpen(false);
                    setIsSent(false); // Reset for next time
                }, 2000);
            } else {
                toast({
                    title: "Error",
                    description: result.message,
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (tenant.invitationStatus === 'Accepted' || tenant.authUserId) {
        return (
            <Button variant="ghost" size="sm" disabled className="text-green-600">
                <CheckCircle className="mr-2 h-4 w-4" />
                Active
            </Button>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Mail className="mr-2 h-4 w-4" />
                        Invite
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Invite Tenant</DialogTitle>
                    <DialogDescription>
                        Send an email invitation to <strong>{tenant.firstName} {tenant.lastName}</strong> to join PropTraka.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email
                        </Label>
                        <Input
                            id="email"
                            value={tenant.email}
                            disabled
                            className="col-span-3"
                        />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                        They will receive a link to set their password and access the tenant portal.
                    </p>
                </div>
                <DialogFooter>
                    {isSent ? (
                        <Button disabled variant="secondary" className="w-full">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Invitation Sent!
                        </Button>
                    ) : (
                        <Button onClick={handleInvite} disabled={isLoading} className="w-full">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Invitation
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
