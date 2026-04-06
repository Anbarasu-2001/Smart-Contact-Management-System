import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button 
      className={`bg-[var(--primary)] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all duration-200 hover:scale-105 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
