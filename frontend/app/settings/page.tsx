"use client";
import dynamic from "next/dynamic";
const UserSettingsProfile = dynamic(
  () => import("../../components/pages/UserSettingsProfile"),
  { ssr: false },
);

export default function SettingsPage() {
  return <UserSettingsProfile />;
}
