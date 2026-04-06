import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 shadow-sm transition-all duration-200 hover:scale-105 ${className}`}>
      {children}
    </div>
  );
}
