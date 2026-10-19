import "./env";
import { getRepository } from "../src/lib/db";
import { getPool } from "../src/lib/db/postgres";
import { updateTrades } from "../src/lib/jobs/updateTrades";

async function main() {
  const pagesArg = process.argv.find((a) => a.startsWith("--pages="));
  const result = await updateTrades(await getRepository(), { maxPages: pagesArg ? Number(pagesArg.split("=")[1]) : undefined });
  console.table(result.stats);
  if (result.message) console.log(result.message);
  await getPool().end().catch(() => {});
  process.exit(result.status === "error" ? 1 : 0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
