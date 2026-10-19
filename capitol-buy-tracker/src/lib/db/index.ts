import { config } from "../config";
import type { Repository } from "./repository";
import { PostgresRepository } from "./postgres";

let repo: Repository | null = null;

export async function getRepository(): Promise<Repository> {
  if (repo) return repo;
  if (config.dataMode === "mock") {
    const { MockRepository } = await import("./mock");
    repo = new MockRepository();
  } else {
    repo = new PostgresRepository();
  }
  return repo;
}
