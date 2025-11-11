import { type ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster"
import '@/app/globals.css';
import { ThemeProvider } from '@/context/theme-context';
import { ClientProviderWrapper } from './client-provider';
import type { Metadata } from 'next';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans'
});

export const metadata: Metadata = {
  title: {
    template: '%s | LeaseLync',
    default: 'LeaseLync - Smart Property Management',
  },
  description: 'The smart, simple way to manage your rental properties. Track revenue, expenses, maintenance, and arrears all in one place.',
  keywords: ['property management', 'landlord software', 'rental management', 'tenant tracking', 'real estate'],
};


export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ClientProviderWrapper>
          <ThemeProvider>
              {children}
          </ThemeProvider>
          <Toaster />
        </ClientProviderWrapper>
      </body>
    </html>
  );
}
