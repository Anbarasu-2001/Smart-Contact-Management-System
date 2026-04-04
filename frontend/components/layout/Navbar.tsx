"use client";

import { useContext } from "react";
import { AuthContext } from "../../context/auth/AuthContext";

export const Navbar = () => {
  const authContext = useContext(AuthContext);
  const { user, logout } = authContext || {};

  return (
    <div className="w-full h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-white/10">
      {/* LEFT */}
      <div className="text-lg font-semibold text-white">
        SmartContact
      </div>

      {/* CENTER SEARCH */}
      <div className="w-full max-w-md">
        <input
          placeholder="Search..."
          className="bg-white/10 text-white px-3 py-1 rounded w-full"
        />
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        <span className="text-white">
          Hello, {user?.name || "User"}
        </span>
        <button
          onClick={logout}
          className="px-4 py-1 rounded bg-blue-500 text-white"
        >
          Logout
        </button>
      </div>
    </div>
  );
};
