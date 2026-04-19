const fs = require('fs');

// 1. Rewrite AppLayout.tsx
const appLayoutCode = `'use client';
import React from 'react';

type AppLayoutProps = {
    sidebar: React.ReactNode;
    topbar: React.ReactNode;
    rightPanel?: React.ReactNode;
    children: React.ReactNode;
};

export default function AppLayout({ sidebar, topbar, children }: AppLayoutProps) {
    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#eef2ff] via-[#f8fafc] to-[#e0f2fe] text-gray-800 font-['Poppins']">
            {sidebar}
            <div className="flex-1 flex flex-col overflow-hidden">
                {topbar}
                <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
`;
fs.writeFileSync('components/layout/AppLayout.tsx', appLayoutCode);


// 2. Rewrite Sidebar.tsx
const sidebarCode = `"use client";
import React from "react";

type SidebarItem = {
    key: string;
    label: string;
    icon: React.ElementType | any;
};

type SidebarProps = {
    title?: string;
    subtitle?: string;
    items?: SidebarItem[];
    activeKey?: string;
    open?: boolean;
    onClose?: () => void;
    onSelect?: (key: string) => void;
};

export default function Sidebar({
    title = "SmartContact",
    subtitle = "Workspace",
    items = [],
    activeKey = "",
    open = true,
    onClose = () => {},
    onSelect = () => {},
}: SidebarProps) {
    return (
        <aside className="w-64 h-full bg-gradient-to-b from-[#4f46e5] to-[#3b82f6] text-white p-5 flex flex-col justify-between rounded-r-3xl shrink-0 shadow-[4px_0_24px_rgba(79,70,229,0.15)] z-20">
            <div>
                <div className="flex items-center gap-3 mb-8 px-2">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                        <span className="text-white font-bold text-xl">S</span>
                    </div>
                    <div>
                         <h2 className="text-xl font-bold tracking-wide">{title}</h2>
                         <p className="text-xs text-indigo-200 uppercase tracking-widest">{subtitle}</p>
                    </div>
                </div>
                
                <div className="flex flex-col gap-2">
                    {items.map((item) => {
                        const isActive = activeKey === item.key;
                        const Icon = item.icon;
                        return (
                            <div
                                key={item.key}
                                className={\`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 ease-in-out \${
                                    isActive 
                                    ? 'bg-white text-[#4f46e5] shadow-lg scale-[1.02]' 
                                    : 'hover:bg-white/20 hover:scale-[1.02] text-indigo-50'
                                }\`}
                                onClick={() => {
                                    onSelect(item.key);
                                    onClose();
                                }}
                            >
                                {typeof Icon === 'string' ? <i className={Icon} /> : <Icon size={20} />}
                                <span className="font-medium">{item.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="mt-8">
                <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 ease-in-out hover:bg-white/20 hover:scale-[1.02] text-indigo-50"
                    onClick={() => onSelect('logout')}
                >
                    <i className="fas fa-sign-out-alt" />
                    <span className="font-medium">Logout</span>
                </div>
            </div>
        </aside>
    );
}
`;
fs.writeFileSync('components/layout/Sidebar.tsx', sidebarCode);


// 3. Rewrite Topbar.tsx
const topbarCode = `"use client";
import React from 'react';

type TopbarProps = {
    onMenuClick?: () => void;
    title?: string;
};

export default function Topbar({ onMenuClick, title = "Dashboard" }: TopbarProps) {
    return (
        <header className="h-20 px-8 py-4 flex justify-between items-center w-full shrink-0 z-10">
            <div className="flex items-center gap-4">
                <button onClick={onMenuClick} className="lg:hidden text-gray-500 hover:text-indigo-500 transition-colors">
                    <i className="fas fa-bars text-xl" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            </div>
            
            <div className="w-1/2 flex items-center">
                <div className="relative w-full">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search workspace..." 
                        className="w-full bg-white/70 backdrop-blur-md px-12 py-3 rounded-xl shadow-sm border border-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all duration-300 text-gray-700"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="w-10 h-10 rounded-xl bg-white/70 backdrop-blur-md border border-white/40 shadow-sm flex items-center justify-center text-gray-600 hover:text-indigo-500 hover:shadow-md hover:scale-[1.02] transition-all duration-300 relative">
                    <i className="fas fa-bell" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.8)] animate-pulse" />
                </button>
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-semibold text-gray-800">Admin User</span>
                        <span className="text-xs text-gray-500">Workspace Owner</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/30">
                        A
                    </div>
                </div>
            </div>
        </header>
    );
}
`;
fs.writeFileSync('components/layout/Topbar.tsx', topbarCode);

console.log('Layout rewritten perfectly.');
