import { Suspense } from "react";

import ShareGeneratorPage from "@/components/pages/ShareGeneratorPage";

export default function ShareGenerator() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShareGeneratorPage />
    </Suspense>
  );
}
