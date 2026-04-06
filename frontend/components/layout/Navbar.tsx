"use client";

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/auth/AuthContext";
import { useTheme } from "next-themes";
import { Moon, Sun, Search, LogOut } from "lucide-react";

export const Navbar = () => {
  const authContext = useContext(AuthContext);
  const { theme, setTheme } = useTheme();
  const { user, logout } = authContext || {};
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="w-full h-16 border-b border-[var(--border)] flex items-center justify-between px-6 bg-[var(--card)] z-20">
      <div className="font-semibold text-lg text-[var(--text)]">Dashboard</div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          className="border border-[var(--border)] rounded-lg px-3 py-1.5 pl-9 w-64 text-sm bg-transparent text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105 text-gray-500 dark:text-gray-400"
          aria-label="Toggle Theme"
        >
          {mounted ? (
            theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />
          ) : (
            <div className="w-[18px] h-[18px]" />
          )}
        </button>

        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-semibold text-sm">
          {(user?.name || "U").charAt(0).toUpperCase()}
        </div>

        <button
          onClick={logout}
          className="p-2 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 hover:scale-105"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};
