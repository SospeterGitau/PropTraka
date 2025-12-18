// Build timestamp: 2025-12-08

import type { Metadata } from 'next';
import { ThemeProvider } from '@/context/theme-context';
import { DataContextProvider } from '@/context/data-context';
import { FirebaseProvider } from '@/firebase/provider';
import { Toaster } from '@/components/ui/toaster';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'PropTraka',
  description: 'AI-powered property management dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {/* Provider hierarchy: Firebase → Data → Theme → Content */}
        <FirebaseProvider>
          <DataContextProvider>
            <ThemeProvider>
              {children}
              <Toaster />
            </ThemeProvider>
          </DataContextProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
