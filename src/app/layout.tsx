
import type { ReactNode } from 'react';
import { PT_Sans } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster"
import { DataProvider } from '@/context/data-context';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import '@/app/globals.css';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans'
});

export const metadata = {
  title: 'RentVision',
  description: 'A basic ERP for small property rental businesses.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ptSans.variable} font-sans antialiased`}>
        <FirebaseClientProvider>
          <DataProvider>
              {children}
          </DataProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
