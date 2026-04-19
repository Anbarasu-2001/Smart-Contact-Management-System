import React from "react";
import clsx from "clsx";

export default function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={clsx("w-full px-0 items-start justify-start", className)}>
      {children}
    </div>
  );
}
