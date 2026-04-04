"use client";
import dynamic from "next/dynamic";
const Sidebar = dynamic(() => import("@/components/layout/Sidebar"), { ssr: false });

export default function SidebarClient() {
  return (
    <Sidebar
      title="Menu"
      subtitle="Welcome"
      items={[]}
      activeKey=""
      open={true}
      onClose={() => {}}
      onSelect={() => {}}
    />
  );
}