import type { ReactNode } from 'react';
import { ClientProviderWrapper } from './client-provider';
import { ThemeProvider } from '@/context/theme-context';
import { Toaster } from '@/components/ui/toaster';
import '@/app/globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ClientProviderWrapper>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </ClientProviderWrapper>
      </body>
    </html>
  );
}
