import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;

function getDb(): ReturnType<typeof drizzle> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!_db) _db = drizzle(neon(url), { schema });
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    return (getDb() as unknown as Record<string, unknown>)[prop as string];
  },
});
