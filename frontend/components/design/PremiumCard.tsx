'use client';

import React from 'react';
import clsx from 'clsx';

type PremiumCardProps = {
    className?: string;
    children: React.ReactNode;
};

export default function PremiumCard({ className, children }: PremiumCardProps) {
    return (
        <div className={clsx('glass-card premium-card p-4 sm:p-5', className)}>
            {children}
        </div>
    );
}
