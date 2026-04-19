"use client";
import dynamic from "next/dynamic";
const ShareGeneratorPage = dynamic(
  () => import("@/components/pages/ShareGeneratorPage"),
  { ssr: false },
);

export default ShareGeneratorPage;
