import { Suspense } from "react";
import Home from "@/components/pages/Home";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Home />
    </Suspense>
  );
}
