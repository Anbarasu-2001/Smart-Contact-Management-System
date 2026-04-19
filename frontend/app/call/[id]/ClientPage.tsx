"use client";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

const RealTimeCallUI = dynamic(() => import("@/components/call/RealTimeCallUI"), { ssr: false });

export default function ClientPage({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const incoming = searchParams.get("incoming") === "true";
  const name = searchParams.get("name") || "";
  const initialType = (searchParams.get("type") as "audio" | "video") || "video";
  const autoCall = searchParams.get("autoCall") === "1";
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-screen bg-gradient-to-br from-[#e0fff7] via-[#e6e6ff] to-[#ffe6fa]">
      <RealTimeCallUI contactId={id} incoming={incoming} name={name} initialType={initialType} autoCall={autoCall} />
    </div>
  );
}