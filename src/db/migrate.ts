import { pool } from "./connection";

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cities (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS forecasts (
      id SERIAL PRIMARY KEY,
      city_id INTEGER NOT NULL REFERENCES cities(id),
      date DATE NOT NULL,
      temperature_max DOUBLE PRECISION,
      temperature_min DOUBLE PRECISION,
      precipitation_mm DOUBLE PRECISION,
      snowfall_cm DOUBLE PRECISION,
      wind_speed_max DOUBLE PRECISION,
      cloud_cover_mean INTEGER,
      fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(city_id, date)
    );
  `);
  console.log("Migration complete.");
  await pool.end();
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
