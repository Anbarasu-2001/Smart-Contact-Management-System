"use client";

import React from "react";
import clsx from "clsx";
import { Button } from "@heroui/button";

type PremiumButtonProps = React.ComponentProps<typeof Button> & {
  glow?: boolean;
};

export default function PremiumButton({
  className,
  glow = true,
  children,
  ...props
}: PremiumButtonProps) {
  return (
    <Button
      {...props}
      className={clsx(
        glow
          ? "premium-share-cta"
          : "glass-action text-gray-500 border-cyan-300/25",
        className,
      )}
    >
      {children}
    </Button>
  );
}
