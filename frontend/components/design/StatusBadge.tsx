'use client';

import React from 'react';
import clsx from 'clsx';

type StatusBadgeProps = {
    label: string;
    tone?: 'default' | 'success' | 'warning' | 'danger';
    className?: string;
};

const toneClass: Record<NonNullable<StatusBadgeProps['tone']>, string> = {
    default: 'text-cyan-100 border-cyan-300/30 bg-cyan-500/20',
    success: 'text-emerald-100 border-emerald-300/30 bg-emerald-500/20',
    warning: 'text-amber-100 border-amber-300/30 bg-amber-500/20',
    danger: 'text-rose-100 border-rose-300/30 bg-rose-500/20',
};

export default function StatusBadge({ label, tone = 'default', className }: StatusBadgeProps) {
    return <span className={clsx('badge-pill', toneClass[tone], className)}>{label}</span>;
}
