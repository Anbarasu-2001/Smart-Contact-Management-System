'use client';

import React from 'react';
import { Button } from '@heroui/button';

type TopbarProps = {
    title: string;
    search: string;
    searchPlaceholder: string;
    onSearchChange: (value: string) => void;
    onSearchClear: () => void;
    onOpenSidebar: () => void;
    searchNode: React.ReactNode;
    actions: React.ReactNode;
};

export default function Topbar({ title, onOpenSidebar, searchNode, actions }: TopbarProps) {
    return (
        <div className="flex items-center h-16 w-full max-w-7xl mx-auto px-0 gap-6">
            <div className="flex items-center gap-3 font-semibold text-lg bg-clip-text text-transparent bg-gradient-to-r from-cyan-200 to-blue-300 shrink-0">
                <Button
                    isIconOnly
                    variant="light"
                    className="xl:hidden text-slate-200"
                    aria-label="Open navigation"
                    onPress={onOpenSidebar}
                >
                    <i className="fas fa-bars" />
                </Button>
                {title}
            </div>
            <div className="flex-1 flex items-center justify-center">{searchNode}</div>
            <div className="flex items-center gap-3">{actions}</div>
        </div>
    );
}
