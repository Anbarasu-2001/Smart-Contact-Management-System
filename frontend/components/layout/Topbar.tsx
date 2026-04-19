"use client";
import React from "react";

type TopbarProps = {
  onMenuClick?: () => void;
  onOpenSidebar?: () => void;
  title?: string;
  search?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  onSearchClear?: () => void;
  searchNode?: React.ReactNode;
  actions?: React.ReactNode;
};

export default function Topbar({
  onMenuClick,
  onOpenSidebar,
  title = "Dashboard",
  search = "",
  searchPlaceholder = "Search workspace...",
  onSearchChange,
  onSearchClear,
  searchNode,
  actions,
}: TopbarProps) {
  const menuHandler = onMenuClick || onOpenSidebar;

  return (
    <header className="h-20 px-6 flex justify-between items-center w-full shrink-0 z-10">
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden text-gray-600 hover:text-purple-600 transition-all duration-300"
          onClick={menuHandler}
        >
          <i className="fas fa-bars text-xl" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      </div>

      <div className="w-1/2 flex items-center">
        {searchNode || (
          <div className="relative w-full">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full bg-white/60 backdrop-blur-md px-12 py-2 rounded-xl shadow-lg border border-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-gray-700"
              placeholder={searchPlaceholder}
              type="text"
              value={search}
              onChange={(event) => onSearchChange?.(event.target.value)}
            />
            {search && (
              <button
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                type="button"
                onClick={onSearchClear}
              >
                <i className="fas fa-xmark" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {actions || (
          <>
            <button className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-md border border-white/40 shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-500 hover:shadow-[0_0_15px_#3b82f6] transition-all duration-300 relative">
              <i className="fas fa-bell" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.8)] animate-pulse" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-800">
                  Admin User
                </span>
                <span className="text-xs text-gray-500">Workspace Owner</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center font-bold shadow-[0_0_15px_#a855f7] transition-all duration-300">
                A
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
