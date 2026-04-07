"use client";
import dynamic from "next/dynamic";
const Sidebar = dynamic(() => import("@/components/layout/Sidebar"), { ssr: false });
import { LayoutDashboard, MessageCircle, Users, Bell, Link as LinkIcon } from "lucide-react";

import { usePathname, useRouter } from "next/navigation";

export default function SidebarClient() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { key: "home", label: "Chats", icon: MessageCircle, path: "/" },
    { key: "contact", label: "Contacts", icon: Users, path: "/contact" },
    { key: "reminders", label: "Reminders", icon: Bell, path: "/reminders" },
    { key: "share", label: "Secure Links", icon: LinkIcon, path: "/secure-links" },
  ];

  return (
    <Sidebar
      title="SmartContact"
      subtitle="Real-time Comm"
      items={navItems}
      activeKey={navItems.find(n => pathname === n.path)?.key || ""}
      open={true}
      onClose={() => {}}
      onSelect={(key) => {
        const item = navItems.find((n) => n.key === key);
        if (item) router.push(item.path);
      }}
    />
  );
}