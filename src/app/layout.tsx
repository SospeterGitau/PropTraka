import { type ReactNode } from 'react';
import { Inter, Lora } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster"
import '@/app/globals.css';
import { ThemeProvider } from '@/context/theme-context';
import { ClientProviderWrapper } from './client-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans'
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-headline'
})

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${lora.variable} font-sans antialiased`}>
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
