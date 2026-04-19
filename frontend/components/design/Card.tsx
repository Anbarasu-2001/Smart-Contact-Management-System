import React from "react";
import clsx from "clsx";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export default function Card({ className, children }: CardProps) {
  return (
    <div className={clsx("bg-white  rounded-2xl shadow-lg p-6", className)}>
      {children}
    </div>
  );
}
