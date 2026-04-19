import React from "react";
import clsx from "clsx";

interface SectionProps {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

export default function Section({
  title,
  subtitle,
  className,
  children,
  headerRight,
}: SectionProps) {
  return (
    <section className={clsx("", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-500  leading-tight">
            {title}
          </h2>
          {subtitle && <p className="text-sm text-gray-500 ">{subtitle}</p>}
        </div>
        {headerRight && <div>{headerRight}</div>}
      </div>
      {children}
    </section>
  );
}
