import { config } from "./config";

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Manual calls may also use ?secret=. */
export function authorizeCron(req: Request): boolean {
  const secret = config.cronSecret;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("secret") === secret;
}
