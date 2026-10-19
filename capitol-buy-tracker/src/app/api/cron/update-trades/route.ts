import { handle, json } from "@/lib/api";
import { authorizeCron } from "@/lib/cron";
import { getRepository } from "@/lib/db";
import { updateTrades } from "@/lib/jobs/updateTrades";
import { invalidateDataset } from "@/lib/dataset";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  return handle(async () => {
    if (!authorizeCron(req)) return json({ error: "Unauthorized" }, { status: 401 });
    const result = await updateTrades(await getRepository());
    invalidateDataset();
    return json(result, { status: result.status === "error" ? 502 : 200 });
  });
}
