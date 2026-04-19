"use client";

import React from "react";
import clsx from "clsx";
import { Input } from "@heroui/input";

type PremiumInputProps = React.ComponentProps<typeof Input>;

export default function PremiumInput({
  className,
  classNames,
  ...props
}: PremiumInputProps) {
  return (
    <Input
      {...props}
      className={clsx("w-full", className)}
      classNames={{
        inputWrapper:
          " border border-cyan-300/25 rounded-2xl shadow-lg group-data-[focus=true]:border-cyan-300/60 group-data-[focus=true]: transition-all",
        input: "text-gray-500 placeholder:text-gray-500",
        ...classNames,
      }}
    />
  );
}
