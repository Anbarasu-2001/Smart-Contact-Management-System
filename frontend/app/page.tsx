import { Suspense } from "react";

import Home from "@/components/pages/Home";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Home hideAIPanel />
    </Suspense>
  );
}
