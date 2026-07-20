import { Pool } from "pg";
import { env } from "../config/env";

export const pool = new Pool({ connectionString: env.DATABASE_URL });

pool.on("error", (err) => {
  console.error("Unexpected DB pool error", err);
  process.exit(1);
});

export async function connectDB() {
  const client = await pool.connect();
  client.release();
}

process.on("SIGTERM", () => pool.end());
