import "./env";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getPool } from "../src/lib/db/postgres";

async function main() {
  const sql = readFileSync(path.join(__dirname, "..", "db", "schema.sql"), "utf8");
  await getPool().query(sql);
  console.log("✔ Schema applied");
  await getPool().end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
