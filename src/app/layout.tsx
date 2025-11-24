
// Build timestamp: 2024-11-18T10:45:00Z
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/context/theme-context';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseProvider } from '@/firebase';
import '@/app/globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <FirebaseProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </FirebaseProvider>
      </body>
    </html>
  );
}
