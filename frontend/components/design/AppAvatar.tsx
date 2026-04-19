"use client";

import React from "react";
import clsx from "clsx";

type AppAvatarProps = {
  name?: string;
  className?: string;
};

export default function AppAvatar({ name = "U", className }: AppAvatarProps) {
  return (
    <div className={clsx("avatar-orb", className)}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
