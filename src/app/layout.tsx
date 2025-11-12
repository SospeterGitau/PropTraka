import { ReactNode } from 'react';
import { ClientProviderWrapper } from './client-provider';
// You may need to import your global CSS file here
// import './globals.css'; 

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientProviderWrapper>
          {children}
        </ClientProviderWrapper>
      </body>
    </html>
  );
}
