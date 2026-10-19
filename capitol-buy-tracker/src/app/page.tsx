import { Suspense } from "react";
import { OverviewView } from "@/components/views/OverviewView";
import { Loading } from "@/components/ui/States";

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <OverviewView />
    </Suspense>
  );
}
