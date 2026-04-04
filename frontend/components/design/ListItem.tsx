'use client';

import React from 'react';
import clsx from 'clsx';

type ListItemProps = {
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
} & React.HTMLAttributes<HTMLDivElement>;

export default function ListItem({ className, children, onClick, ...props }: ListItemProps) {
    return (
        <div
            {...props}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick}
            onKeyDown={(event) => {
                if (!onClick) return;
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                onClick();
            }}
            className={clsx('glass-card p-3 transition-all duration-300', className)}
        >
            {children}
        </div>
    );
}
