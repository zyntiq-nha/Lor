import { Suspense } from "react";
import VerifyClientPage from "./verify-client";

export default function VerifyPage() {
  return (
    <Suspense fallback={<main className="container page"><section className="card">Loading verify page...</section></main>}>
      <VerifyClientPage />
    </Suspense>
  );
}