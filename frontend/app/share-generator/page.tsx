import { Suspense } from "react";

import ShareGeneratorPage from "./ShareGeneratorClient";

export default function ShareGenerator() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500">Loading...</div>
      }
    >
      <ShareGeneratorPage />
    </Suspense>
  );
}
