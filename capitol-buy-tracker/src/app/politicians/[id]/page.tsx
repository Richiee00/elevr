import { Suspense } from "react";
import { PoliticianDetailView } from "@/components/views/PoliticianDetailView";
import { Loading } from "@/components/ui/States";

export const metadata = { title: "Politician · Capitol Buy Tracker" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<Loading />}>
      <PoliticianDetailView id={decodeURIComponent(id)} />
    </Suspense>
  );
}
