import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  children?: ReactNode;
};

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 mb-8 border-b">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
      {children && <div className="flex items-center gap-2 self-end sm:self-auto">{children}</div>}
    </div>
  );
}
