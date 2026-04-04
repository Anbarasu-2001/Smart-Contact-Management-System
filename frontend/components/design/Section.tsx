import React from 'react';
import clsx from 'clsx';

interface SectionProps {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

export default function Section({ title, subtitle, className, children, headerRight }: SectionProps) {
  return (
    <section className={clsx('mb-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 leading-tight">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">{subtitle}</p>}
        </div>
        {headerRight && <div>{headerRight}</div>}
      </div>
      {children}
    </section>
  );
}
