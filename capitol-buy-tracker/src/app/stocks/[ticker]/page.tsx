import { Suspense } from "react";
import { StockDetailView } from "@/components/views/StockDetailView";
import { Loading } from "@/components/ui/States";

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  return { title: `${decodeURIComponent(ticker).toUpperCase()} · Capitol Buy Tracker` };
}

export default async function Page({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  return (
    <Suspense fallback={<Loading />}>
      <StockDetailView ticker={decodeURIComponent(ticker).toUpperCase()} />
    </Suspense>
  );
}
