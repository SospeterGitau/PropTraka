// Build timestamp: 2024-11-18T10:45:00Z
import { DataContextProvider } from '@/context/data-context';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/context/theme-context';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseProvider } from '@/firebase/provider';
import '@/app/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
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
