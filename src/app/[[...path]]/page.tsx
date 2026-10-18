import { Application } from "@/components/application";
import { Suspense } from "react";
export default function Page() {
  return (
    <Suspense fallback={<main className="standalone">Memuat layanan…</main>}>
      <Application />
    </Suspense>
  );
}
