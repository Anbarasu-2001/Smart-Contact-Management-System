const fs = require('fs');
const path = require('path');

const topbarPath = path.join('frontend', 'components', 'layout', 'Topbar.tsx');
const topbarContent = `'use client';

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

export default function Topbar({ title, search, searchPlaceholder, onSearchChange, onOpenSidebar, actions }: TopbarProps) {
    return (
        <div className="w-full flex justify-between items-center mb-6 mt-4 relative">
            
            {/* Left Box (Mobile Menu + Top Title) */}
            <div className="flex items-center gap-3">
                <Button
                    isIconOnly
                    variant="light"
                    className="lg:hidden text-gray-800 hover:bg-white/40 rounded-xl"
                    aria-label="Open navigation"
                    onPress={onOpenSidebar}
                >
                    <i className="fas fa-bars text-lg" />
                </Button>
                <span className="hidden sm:block font-bold text-xl text-teal-800 tracking-wide">{title}</span>
            </div>

            {/* Center Search Input */}
            <input 
                type="text"
                value={search || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder || "Search dashboard..."}
                className="bg-white/60 backdrop-blur px-4 py-2 rounded-xl w-1/2 border border-white/40 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all duration-300 text-gray-800 placeholder-gray-500 hover:shadow-cyan-500/20 hover:bg-white/80" 
            />

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                {actions}
            </div>

        </div>
    );
}
`;

fs.writeFileSync(topbarPath, topbarContent);

// Strip extraneous formatting from AppLayout so mb-6 functions correctly without extra wrapping
const layoutPath = path.join('frontend', 'components', 'layout', 'AppLayout.tsx');
let layout = fs.readFileSync(layoutPath, 'utf8');
layout = layout.replace('<header className="h-20 flex items-center justify-between w-full px-6 py-4">', '<header className="w-full px-6 pt-4 shrink-0">');
fs.writeFileSync(layoutPath, layout);

console.log('Topbar replaced!');
