import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`bg-[var(--primary)] text-gray-800 px-4 py-2 rounded-2xl hover:opacity-90 transition-all duration-200 hover:scale-[1.02] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
