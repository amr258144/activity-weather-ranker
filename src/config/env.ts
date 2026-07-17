import "dotenv/config";

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || "",
  PORT: Number(process.env.PORT) || 4000,
  CACHE_TTL_HOURS: Number(process.env.CACHE_TTL_HOURS) || 3,
};
