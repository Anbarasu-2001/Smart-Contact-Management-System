"use client";

import React from "react";

type SidebarItem = {
    key: string;
    label: string;
    icon: React.ElementType;
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
    title = "Menu",
    subtitle = "Welcome",
    items = [],
    activeKey = "",
    open = true,
    onClose = () => {},
    onSelect = () => {},
}: SidebarProps) {
    return (
        <>
            {open && (
                <button
                    type="button"
                    aria-label="Close sidebar"
                    className="fixed inset-0 z-40 bg-slate-950/55 xl:hidden"
                    onClick={onClose}
                />
            )}
            <aside className="w-full h-full bg-[var(--card)] flex flex-col py-6">
                <div className="px-6 mb-2">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
                            <span className="text-white font-bold text-lg">S</span>
                        </div>
                        <h2 className="text-xl font-semibold text-[var(--text)]">{title}</h2>
                    </div>
                    <p className="text-xs font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wider">{subtitle}</p>
                </div>
                
                <div className="flex flex-col gap-2 p-4">
                    {items.map((item) => {
                        const isActive = activeKey === item.key;
                        const Icon = item.icon;
                        return (
                            <div
                                key={item.key}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
                                    isActive 
                                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium" 
                                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                  }`}
                                onClick={() => {
                                    onSelect(item.key);
                                    onClose();
                                }}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </div>
                        );
                    })}
                </div>
            </aside>
        </>
    );
}
