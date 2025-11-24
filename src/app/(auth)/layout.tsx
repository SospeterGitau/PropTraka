
'use client';

// No provider needed here anymore as it's in the root layout.

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40 p-4">
        {children}
    </div>
  );
}
