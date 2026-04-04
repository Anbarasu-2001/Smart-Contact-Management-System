import React from 'react';
import clsx from 'clsx';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export default function Card({ className, children }: CardProps) {
  return (
    <div className={clsx('bg-white dark:bg-[#18223a] rounded-2xl shadow-md p-6', className)}>
      {children}
    </div>
  );
}
