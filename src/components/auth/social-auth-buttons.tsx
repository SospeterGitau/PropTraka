
'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const GoogleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
        <path d="M1 1h22v22H1z" fill="none"></path>
    </svg>
);

const FacebookIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v7.8c4.56-.93 8-4.96 8-9.8z" fill="#1877F2"></path>
    </svg>
);

const AppleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path d="M17.6 12.2c.2-2.3-1.6-4.1-3.6-4.1-1.3 0-2.5.8-3.2 1.9-.8-1.2-2.2-1.9-3.6-1.9-2.2 0-4 1.8-4 4.2 0 2.5 1.5 5.5 3.5 7.4.9.9 2 1.8 3.3 1.8 1.2 0 1.9-.7 3.3-1.8 1.9-1.9 3.4-4.8 3.3-7.4zm-4-5.3c.3-.9 1-1.4 1.8-1.4.2 0 .4.1.5.1-.9.5-1.5 1.4-1.6 2.4-.1.1-.3.2-.7.2-1.2 0-2.1-1-2-1.3zm-5 0c.9 0 1.9.8 2.2 1.9-.3.1-.7.2-1.1.2-.9 0-1.8-.7-1.8-1.6 0-.2.2-.4.7-.5z" fill="currentColor"></path>
    </svg>
);


interface SocialAuthButtonsProps {
    onGoogleSignIn: () => void;
    isPending: boolean;
}

const socialButtons = [
    { name: 'Google', icon: GoogleIcon, action: (props: SocialAuthButtonsProps) => props.onGoogleSignIn, disabled: false },
    { name: 'Facebook', icon: FacebookIcon, disabled: true },
    { name: 'Apple', icon: AppleIcon, disabled: true },
]

export function SocialAuthButtons({ onGoogleSignIn, isPending }: SocialAuthButtonsProps) {
    return (
        <div className="space-y-2">
            {socialButtons.map(provider => {
                const button = (
                    <Button
                        key={provider.name}
                        variant="outline"
                        type="button"
                        className="w-full"
                        onClick={provider.action ? () => provider.action({ onGoogleSignIn, isPending }) : undefined}
                        disabled={provider.disabled || isPending}
                    >
                         {isPending && !provider.disabled ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <provider.icon />}
                         {provider.name}
                    </Button>
                );

                if(provider.disabled) {
                    return (
                        <TooltipProvider key={provider.name}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="w-full cursor-not-allowed">{button}</div>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>Coming soon!</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )
                }
                return button;
            })}
        </div>
    );
}
