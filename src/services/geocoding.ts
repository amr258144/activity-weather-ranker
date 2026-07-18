import { pool } from "../db/connection";

interface GeoResult {
  latitude: number;
  longitude: number;
  name: string;
}

async function callGeocodingApi(city: string, retries = 3): Promise<GeoResult> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(url);
    if (res.ok) {
      const data: any = await res.json();
      if (!data.results?.length) throw new Error(`City not found: ${city}`);
      const { latitude, longitude, name } = data.results[0];
      return { latitude, longitude, name };
    }
    if (res.status === 404 || attempt === retries) throw new Error(`Geocoding API error: ${res.status}`);
    await new Promise(r => setTimeout(r, 200 * attempt)); // exponential-ish backoff
  }
  throw new Error("Geocoding failed"); // unreachable, satisfies TS
}

export async function getOrCreateCity(city: string): Promise<{ id: number; name: string; latitude: number; longitude: number }> {
  const { rows } = await pool.query("SELECT id, name, latitude, longitude FROM cities WHERE LOWER(name) = $1", [city.toLowerCase()]);
  if (rows.length) return rows[0];

  const geo = await callGeocodingApi(city);
  const result = await pool.query(
    "INSERT INTO cities (name, latitude, longitude) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude RETURNING id, name, latitude, longitude",
    [geo.name, geo.latitude, geo.longitude]
  );
  return result.rows[0];
}