import React from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={`min-h-screen relative overflow-hidden bg-slate-50 ${inter.className}`}>
            {/* Background Gradients for Glassmorphism */}
            <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-purple-400/30 blur-[100px]" />
            <div className="absolute top-[20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-blue-400/30 blur-[100px]" />
            <div className="absolute bottom-[-10%] left-[20%] h-[600px] w-[600px] rounded-full bg-indigo-400/30 blur-[100px]" />

            <nav className="sticky top-0 z-50 border-b border-white/20 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-md md:px-8">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Placeholder Logo */}
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold shadow-lg">
                            P
                        </div>
                        <span className="text-lg font-bold text-slate-900">PropTraka Portal</span>
                    </div>
                    {/* Placeholder for User Menu */}
                    <div className="h-8 w-8 rounded-full bg-slate-200 ring-2 ring-white" />
                </div>
            </nav>
            <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 md:px-8">
                {children}
            </main>
        </div>
    );
}
