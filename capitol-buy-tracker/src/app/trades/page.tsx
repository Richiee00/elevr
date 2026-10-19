import { Suspense } from "react";
import { TradesView } from "@/components/views/TradesView";
import { Loading } from "@/components/ui/States";

export const metadata = { title: "Individual Trades · Capitol Buy Tracker" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <TradesView />
    </Suspense>
  );
}
