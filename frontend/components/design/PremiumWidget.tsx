"use client";

import React from "react";

import PremiumCard from "./PremiumCard";

type PremiumWidgetProps = {
  title: string;
  value: string;
  icon: string;
};

export default function PremiumWidget({
  title,
  value,
  icon,
}: PremiumWidgetProps) {
  return (
    <PremiumCard className="h-full">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm app-muted">{title}</p>
        <span className="text-indigo-500/90 text-base">
          <i className={`fas ${icon}`} />
        </span>
      </div>
      <p className="text-[1.85rem] font-semibold tracking-tight text-gray-500">
        {value}
      </p>
    </PremiumCard>
  );
}
