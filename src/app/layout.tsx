
// Build timestamp: 2024-11-18T10:45:00Z
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/context/theme-context';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import '@/app/globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <FirebaseClientProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
