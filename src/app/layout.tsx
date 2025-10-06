import type {Metadata} from 'next';
import { PT_Sans } from 'next/font/google';
import { Toaster } from "@/components/ui/toaster"
import '@/app/globals.css';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-sans'
});

export const metadata: Metadata = {
  title: 'RentVision',
  description: 'A basic ERP for small property rental businesses.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${ptSans.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
