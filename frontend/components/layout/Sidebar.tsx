"use client";
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
    <aside className="w-64 h-full bg-gradient-to-b from-purple-500 to-blue-500 text-white p-5 rounded-2xl flex flex-col justify-between shrink-0 shadow-[0_0_15px_#3b82f6] transition-all duration-300">
      <div>
        <div className="flex items-center gap-3  px-2">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wide">{title}</h2>
            <p className="text-xs text-indigo-200 uppercase tracking-widest">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const isActive = activeKey === item.key;
            const Icon = item.icon;

            return (
              <div
                key={item.key}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 ${
                  isActive
                    ? "bg-white text-purple-600 shadow-lg"
                    : "hover:bg-white/20 hover:shadow-[0_0_10px_rgba(255,255,255,0.3)] text-indigo-50"
                }`}
                onClick={() => {
                  onSelect(item.key);
                  onClose();
                }}
              >
                {typeof Icon === "string" ? (
                  <i className={Icon} />
                ) : (
                  <Icon size={20} />
                )}
                <span className="font-medium">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 hover:bg-white/20 hover:shadow-[0_0_10px_rgba(255,255,255,0.3)] text-indigo-50"
          onClick={() => onSelect("logout")}
        >
          <i className="fas fa-sign-out-alt" />
          <span className="font-medium">Logout</span>
        </div>
      </div>
    </aside>
  );
}
