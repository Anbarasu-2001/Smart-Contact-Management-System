"use client";

import React from "react";

type SidebarItem = {
    key: string;
    label: string;
    icon: string;
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
            <aside
                className={
                    "w-64 h-full fixed left-0 top-0 z-30 bg-white/10 dark:bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col space-y-2 py-6 px-4"
                }
                style={{ minWidth: 256, maxWidth: 256 }}
            >
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-300 mt-1">{subtitle}</p>
                </div>
                <nav className="flex flex-col space-y-2">
                    {items.map((item) => {
                        const isActive = activeKey === item.key;
                        return (
                            <button
                                key={item.key}
                                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-base font-medium transition-colors
                                    ${isActive ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg" : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                                onClick={() => {
                                    onSelect(item.key);
                                    onClose();
                                }}
                            >
                                <i className={`fas ${item.icon} w-5 text-center ${isActive ? "text-white" : "opacity-70"}`} />
                                {item.label}
                                {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-white" />}
                            </button>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
