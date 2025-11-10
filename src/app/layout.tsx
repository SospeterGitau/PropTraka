'use client';
import { type ReactNode } from 'react';
import { PT_Sans } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster"
import '@/app/globals.css';
import { ThemeProvider } from '@/context/theme-context';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans'
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ptSans.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
