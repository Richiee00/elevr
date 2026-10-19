import { handle, json } from "@/lib/api";
import { authorizeCron } from "@/lib/cron";
import { getRepository } from "@/lib/db";
import { updatePrices } from "@/lib/jobs/updatePrices";
import { invalidateDataset } from "@/lib/dataset";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  return handle(async () => {
    if (!authorizeCron(req)) return json({ error: "Unauthorized" }, { status: 401 });
    const force = new URL(req.url).searchParams.get("force") === "1";
    const result = await updatePrices(await getRepository(), { force });
    invalidateDataset();
    return json(result, { status: result.status === "error" ? 502 : 200 });
  });
}
