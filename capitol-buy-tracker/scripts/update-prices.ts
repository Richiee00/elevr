import "./env";
import { getRepository } from "../src/lib/db";
import { getPool } from "../src/lib/db/postgres";
import { updatePrices } from "../src/lib/jobs/updatePrices";

async function main() {
  const result = await updatePrices(await getRepository(), { force: process.argv.includes("--force") });
  console.table(result.stats);
  if (result.message) console.log(result.message);
  await getPool().end().catch(() => {});
  process.exit(result.status === "error" ? 1 : 0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
