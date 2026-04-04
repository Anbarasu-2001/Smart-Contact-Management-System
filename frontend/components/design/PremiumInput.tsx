'use client';

import React from 'react';
import clsx from 'clsx';
import { Input } from '@heroui/input';

type PremiumInputProps = React.ComponentProps<typeof Input>;

export default function PremiumInput({ className, classNames, ...props }: PremiumInputProps) {
    return (
        <Input
            {...props}
            className={clsx('w-full', className)}
            classNames={{
                inputWrapper:
                    'bg-slate-950/70 border border-cyan-300/25 rounded-2xl shadow-none group-data-[focus=true]:border-cyan-300/60 group-data-[focus=true]:bg-slate-950/85 transition-all',
                input: 'text-slate-100 placeholder:text-slate-400',
                ...classNames,
            }}
        />
    );
}
