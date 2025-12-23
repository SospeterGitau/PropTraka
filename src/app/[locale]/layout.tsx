import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
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

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          {/* Provider hierarchy: Firebase → Data → Theme → Content */}
          <FirebaseProvider>
            <DataContextProvider>
              <ThemeProvider>
                {children}
                <Toaster />
              </ThemeProvider>
            </DataContextProvider>
          </FirebaseProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
