const fs = require('fs');
const path = require('path');

const sidebarPath = path.join('frontend', 'components', 'layout', 'Sidebar.tsx');

const sidebarContent = `"use client";

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
    title = "SmartContact",
    subtitle = "Premium Dashboard",
    items = [],
    activeKey = "",
    open = true,
    onClose = () => {},
    onSelect = () => {},
}: SidebarProps) {
    return (
        <div className="w-full h-full flex flex-col justify-between text-white">
            {open && (
                <button
                    type="button"
                    aria-label="Close sidebar"
                    className="fixed inset-0 z-40 bg-slate-950/55 xl:hidden"
                    onClick={onClose}
                />
            )}
            
            {/* Standard Soft UI Content */}
            <div className="flex flex-col z-50">
                <div className="flex items-center gap-3 mb-10 px-2 mt-2">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/30">
                        <span className="text-white font-bold text-xl drop-shadow-md">S</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-wide drop-shadow-md">{title}</h2>
                        <p className="text-xs text-white/80 font-medium tracking-wider uppercase">{subtitle}</p>
                    </div>
                </div>
                
                {/* Menu Items */}
                <div className="flex flex-col gap-2">
                    {items.map((item) => {
                        const isActive = activeKey === item.key;
                        const Icon = item.icon;
                        return (
                            <div
                                key={item.key}
                                className={\`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 \${
                                    isActive 
                                      ? "bg-white text-teal-600 shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-[1.02]" 
                                      : "text-white hover:bg-white/20 hover:scale-105 hover:shadow-[0_0_15px_rgba(0,245,255,0.4)]"
                                  }\`}
                                onClick={() => {
                                    onSelect(item.key);
                                    onClose();
                                }}
                            >
                                <Icon size={20} className={isActive ? "text-teal-500" : "text-white/90"} />
                                <span className={"font-medium " + (isActive ? "text-teal-600" : "text-white")}>{item.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Vault / Pro Section */}
            <div className="mt-8 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm cursor-pointer hover:bg-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-[1.02] transition-all duration-300 z-50">
                <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-sm">PRO</span>
                     </div>
                     <div>
                         <p className="text-sm font-semibold text-white">Smart Vault</p>
                         <p className="text-xs text-white/80">Secured Area</p>
                     </div>
                </div>
            </div>
        </div>
    );
}
`;

fs.writeFileSync(sidebarPath, sidebarContent, 'utf8');
console.log('Sidebar.tsx fully updated!');
