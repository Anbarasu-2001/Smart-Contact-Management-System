"use client";
import React from "react";

type AppLayoutProps = {
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  rightPanel?: React.ReactNode;
  children: React.ReactNode;
};

export default function AppLayout({
  sidebar,
  topbar,
  rightPanel,
  children,
}: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#e0f7fa] via-[#f3e5f5] to-[#e3f2fd] text-gray-800 font-['Poppins']">
      {sidebar}

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {topbar}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex gap-6 w-full min-h-full">
            <div className="flex-1 flex flex-col gap-6">{children}</div>
            {rightPanel && (
              <aside className="hidden xl:flex w-80 shrink-0 flex-col gap-6">
                {rightPanel}
              </aside>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
