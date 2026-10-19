import { Suspense } from "react";
import { StocksView } from "@/components/views/StocksView";
import { Loading } from "@/components/ui/States";

export const metadata = { title: "Stock Aggregation · Capitol Buy Tracker" };

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <StocksView />
    </Suspense>
  );
}
